/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as json from 'bg/base/common/json';
import { ResourceMap, getOrSet } from 'bg/base/common/map';
import * as arrays from 'bg/base/common/arrays';
import * as types from 'bg/base/common/types';
import * as objects from 'bg/base/common/objects';
import { URI, UriComponents } from 'bg/base/common/uri';
import { OVERRIDE_PROPERTY_PATTERN, ConfigurationScope, IConfigurationRegistry, Extensions, IConfigurationPropertySchema, overrideIdentifierFromKey } from 'bg/platform/configuration/common/configurationRegistry';
import { IOverrides, addToValueTree, toValuesTree, IConfigurationModel, getConfigurationValue, IConfigurationOverrides, IConfigurationData, getDefaultValues, getConfigurationKeys, removeFromValueTree, toOverrides, IConfigurationValue, ConfigurationTarget, compare, IConfigurationChangeEvent, IConfigurationChange } from 'bg/platform/configuration/common/configuration';
import { Registry } from 'bg/platform/registry/common/platform';
import { Disposable } from 'bg/base/common/lifecycle';
import { Emitter, Event } from 'bg/base/common/event';
import { IFileService } from 'bg/platform/files/common/files';
import { IExtUri } from 'bg/base/common/resources';

export class ConfigurationModel implements IConfigurationModel {

	private isFrozen: boolean = false;

	constructor(
		private _contents: any = {},
		private _keys: string[] = [],
		private _overrides: IOverrides[] = []
	) {
	}

	get contents(): any {
		return this.checkAndFreeze(this._contents);
	}

	get overrides(): IOverrides[] {
		return this.checkAndFreeze(this._overrides);
	}

	get keys(): string[] {
		return this.checkAndFreeze(this._keys);
	}

	isEmpty(): boolean {
		return this._keys.length === 0 && Object.keys(this._contents).length === 0 && this._overrides.length === 0;
	}

	getValue<V>(section: string | undefined): V {
		return section ? getConfigurationValue<any>(this.contents, section) : this.contents;
	}

	getOverrideValue<V>(section: string | undefined, overrideIdentifier: string): V | undefined {
		const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
		return overrideContents
			? section ? getConfigurationValue<any>(overrideContents, section) : overrideContents
			: undefined;
	}

	getKeysForOverrideIdentifier(identifier: string): string[] {
		for (const override of this.overrides) {
			if (override.identifiers.indexOf(identifier) !== -1) {
				return override.keys;
			}
		}
		return [];
	}

	override(identifier: string): ConfigurationModel {
		const overrideContents = this.getContentsForOverrideIdentifer(identifier);

		if (!overrideContents || typeof overrideContents !== 'object' || !Object.keys(overrideContents).length) {
			// If there are no valid overrides, return self
			return this;
		}

		let contents: any = {};
		for (const key of arrays.distinct([...Object.keys(this.contents), ...Object.keys(overrideContents)])) {

			let contentsForKey = this.contents[key];
			let overrideContentsForKey = overrideContents[key];

			// If there are override contents for the key, clone and merge otherwise use base contents
			if (overrideContentsForKey) {
				// Clone and merge only if base contents and override contents are of type object otherwise just override
				if (typeof contentsForKey === 'object' && typeof overrideContentsForKey === 'object') {
					contentsForKey = objects.deepClone(contentsForKey);
					this.mergeContents(contentsForKey, overrideContentsForKey);
				} else {
					contentsForKey = overrideContentsForKey;
				}
			}

			contents[key] = contentsForKey;
		}

		return new ConfigurationModel(contents, this.keys, this.overrides);
	}

	merge(...others: ConfigurationModel[]): ConfigurationModel {
		const contents = objects.deepClone(this.contents);
		const overrides = objects.deepClone(this.overrides);
		const keys = [...this.keys];

		for (const other of others) {
			this.mergeContents(contents, other.contents);

			for (const otherOverride of other.overrides) {
				const [override] = overrides.filter(o => arrays.equals(o.identifiers, otherOverride.identifiers));
				if (override) {
					this.mergeContents(override.contents, otherOverride.contents);
				} else {
					overrides.push(objects.deepClone(otherOverride));
				}
			}
			for (const key of other.keys) {
				if (keys.indexOf(key) === -1) {
					keys.push(key);
				}
			}
		}
		return new ConfigurationModel(contents, keys, overrides);
	}

	freeze(): ConfigurationModel {
		this.isFrozen = true;
		return this;
	}

	private mergeContents(source: any, target: any): void {
		for (const key of Object.keys(target)) {
			if (key in source) {
				if (types.isObject(source[key]) && types.isObject(target[key])) {
					this.mergeContents(source[key], target[key]);
					continue;
				}
			}
			source[key] = objects.deepClone(target[key]);
		}
	}

	private checkAndFreeze<T>(data: T): T {
		if (this.isFrozen && !Object.isFrozen(data)) {
			return objects.deepFreeze(data);
		}
		return data;
	}

	private getContentsForOverrideIdentifer(identifier: string): any {
		for (const override of this.overrides) {
			if (override.identifiers.indexOf(identifier) !== -1) {
				return override.contents;
			}
		}
		return null;
	}

	toJSON(): IConfigurationModel {
		return {
			contents: this.contents,
			overrides: this.overrides,
			keys: this.keys
		};
	}

	// Update methods

	public setValue(key: string, value: any) {
		this.addKey(key);
		addToValueTree(this.contents, key, value, e => { throw new Error(e); });
	}

	public removeValue(key: string): void {
		if (this.removeKey(key)) {
			removeFromValueTree(this.contents, key);
		}
	}

	private addKey(key: string): void {
		let index = this.keys.length;
		for (let i = 0; i < index; i++) {
			if (key.indexOf(this.keys[i]) === 0) {
				index = i;
			}
		}
		this.keys.splice(index, 1, key);
	}

	private removeKey(key: string): boolean {
		let index = this.keys.indexOf(key);
		if (index !== -1) {
			this.keys.splice(index, 1);
			return true;
		}
		return false;
	}
}

export class DefaultConfigurationModel extends ConfigurationModel {

	constructor() {
		const contents = getDefaultValues();
		const keys = getConfigurationKeys();
		const overrides: IOverrides[] = [];
		for (const key of Object.keys(contents)) {
			if (OVERRIDE_PROPERTY_PATTERN.test(key)) {
				overrides.push({
					identifiers: [overrideIdentifierFromKey(key).trim()],
					keys: Object.keys(contents[key]),
					contents: toValuesTree(contents[key], message => console.error(`Conflict in default settings file: ${message}`)),
				});
			}
		}
		super(contents, keys, overrides);
	}
}

export interface ConfigurationParseOptions {
	scopes: ConfigurationScope[] | undefined;
	skipRestricted?: boolean;
}

export class ConfigurationModelParser {

	private _raw: any = null;
	private _configurationModel: ConfigurationModel | null = null;
	private _restrictedConfigurations: string[] = [];
	private _parseErrors: any[] = [];

	constructor(protected readonly _name: string) { }

	get configurationModel(): ConfigurationModel {
		return this._configurationModel || new ConfigurationModel();
	}

	get restrictedConfigurations(): string[] {
		return this._restrictedConfigurations;
	}

	get errors(): any[] {
		return this._parseErrors;
	}

	public parse(content: string | null | undefined, options?: ConfigurationParseOptions): void {
		if (!types.isUndefinedOrNull(content)) {
			const raw = this.doParseContent(content);
			this.parseRaw(raw, options);
		}
	}

	public reparse(options: ConfigurationParseOptions): void {
		if (this._raw) {
			this.parseRaw(this._raw, options);
		}
	}

	public parseRaw(raw: any, options?: ConfigurationParseOptions): void {
		this._raw = raw;
		const { contents, keys, overrides, restricted } = this.doParseRaw(raw, options);
		this._configurationModel = new ConfigurationModel(contents, keys, overrides);
		this._restrictedConfigurations = restricted || [];
	}

	private doParseContent(content: string): any {
		let raw: any = {};
		let currentProperty: string | null = null;
		let currentParent: any = [];
		let previousParents: any[] = [];
		let parseErrors: json.ParseError[] = [];

		function onValue(value: any) {
			if (Array.isArray(currentParent)) {
				(<any[]>currentParent).push(value);
			} else if (currentProperty) {
				currentParent[currentProperty] = value;
			}
		}

		let visitor: json.JSONVisitor = {
			onObjectBegin: () => {
				let object = {};
				onValue(object);
				previousParents.push(currentParent);
				currentParent = object;
				currentProperty = null;
			},
			onObjectProperty: (name: string) => {
				currentProperty = name;
			},
			onObjectEnd: () => {
				currentParent = previousParents.pop();
			},
			onArrayBegin: () => {
				let array: any[] = [];
				onValue(array);
				previousParents.push(currentParent);
				currentParent = array;
				currentProperty = null;
			},
			onArrayEnd: () => {
				currentParent = previousParents.pop();
			},
			onLiteralValue: onValue,
			onError: (error: json.ParseErrorCode, offset: number, length: number) => {
				parseErrors.push({ error, offset, length });
			}
		};
		if (content) {
			try {
				json.visit(content, visitor);
				raw = currentParent[0] || {};
			} catch (e) {
				console.error(`Error while parsing settings file ${this._name}: ${e}`);
				this._parseErrors = [e];
			}
		}

		return raw;
	}

	protected doParseRaw(raw: any, options?: ConfigurationParseOptions): IConfigurationModel & { restricted?: string[] } {
		const configurationProperties = Registry.as<IConfigurationRegistry>(Extensions.Configuration).getConfigurationProperties();
		const filtered = this.filter(raw, configurationProperties, true, options);
		raw = filtered.raw;
		const contents = toValuesTree(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
		const keys = Object.keys(raw);
		const overrides: IOverrides[] = toOverrides(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
		return { contents, keys, overrides, restricted: filtered.restricted };
	}

	private filter(properties: any, configurationProperties: { [qualifiedKey: string]: IConfigurationPropertySchema | undefined }, filterOverriddenProperties: boolean, options?: ConfigurationParseOptions): { raw: {}, restricted: string[] } {
		if (!options?.scopes && !options?.skipRestricted) {
			return { raw: properties, restricted: [] };
		}
		const raw: any = {};
		const restricted: string[] = [];
		for (let key in properties) {
			if (OVERRIDE_PROPERTY_PATTERN.test(key) && filterOverriddenProperties) {
				const result = this.filter(properties[key], configurationProperties, false, options);
				raw[key] = result.raw;
				restricted.push(...result.restricted);
			} else {
				const propertySchema = configurationProperties[key];
				const scope = propertySchema ? typeof propertySchema.scope !== 'undefined' ? propertySchema.scope : ConfigurationScope.WINDOW : undefined;
				if (propertySchema?.restricted) {
					restricted.push(key);
				}
				// Load unregistered configurations always.
				if (scope === undefined || options.scopes === undefined || options.scopes.includes(scope)) {
					if (!(options.skipRestricted && propertySchema?.restricted)) {
						raw[key] = properties[key];
					}
				}
			}
		}
		return { raw, restricted };
	}

}

export class UserSettings extends Disposable {

	private readonly parser: ConfigurationModelParser;
	private readonly parseOptions: ConfigurationParseOptions;
	protected readonly _onDidChange: Emitter<void> = this._register(new Emitter<void>());
	readonly onDidChange: Event<void> = this._onDidChange.event;

	constructor(
		private readonly userSettingsResource: URI,
		private readonly scopes: ConfigurationScope[] | undefined,
		extUri: IExtUri,
		private readonly fileService: IFileService
	) {
		super();
		this.parser = new ConfigurationModelParser(this.userSettingsResource.toString());
		this.parseOptions = { scopes: this.scopes };
		this._register(this.fileService.watch(extUri.dirname(this.userSettingsResource)));
		// Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
		this._register(this.fileService.watch(this.userSettingsResource));
		this._register(Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.userSettingsResource))(() => this._onDidChange.fire()));
	}

	async loadConfiguration(): Promise<ConfigurationModel> {
		try {
			const content = await this.fileService.readFile(this.userSettingsResource);
			this.parser.parse(content.value.toString() || '{}', this.parseOptions);
			return this.parser.configurationModel;
		} catch (e) {
			return new ConfigurationModel();
		}
	}

	reparse(): ConfigurationModel {
		this.parser.reparse(this.parseOptions);
		return this.parser.configurationModel;
	}

	getRestrictedSettings(): string[] {
		return this.parser.restrictedConfigurations;
	}
}


export class Configuration {

	private _consolidatedConfiguration: ConfigurationModel | null = null;
	private _foldersConsolidatedConfigurations: ResourceMap<ConfigurationModel> = new ResourceMap<ConfigurationModel>();

	constructor(
		private _defaultConfiguration: ConfigurationModel,
		private _localUserConfiguration: ConfigurationModel,
		private _remoteUserConfiguration: ConfigurationModel = new ConfigurationModel(),
		private _folderConfigurations: ResourceMap<ConfigurationModel> = new ResourceMap<ConfigurationModel>(),
		private _memoryConfiguration: ConfigurationModel = new ConfigurationModel(),
		private _memoryConfigurationByResource: ResourceMap<ConfigurationModel> = new ResourceMap<ConfigurationModel>(),
		private _freeze: boolean = true) {
	}

	getValue(section: string | undefined, overrides: IConfigurationOverrides): any {
		const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides);
		return consolidateConfigurationModel.getValue(section);
	}

	updateValue(key: string, value: any, overrides: IConfigurationOverrides = {}): void {
		let memoryConfiguration: ConfigurationModel | undefined;
		if (overrides.resource) {
			memoryConfiguration = this._memoryConfigurationByResource.get(overrides.resource);
			if (!memoryConfiguration) {
				memoryConfiguration = new ConfigurationModel();
				this._memoryConfigurationByResource.set(overrides.resource, memoryConfiguration);
			}
		} else {
			memoryConfiguration = this._memoryConfiguration;
		}

		if (value === undefined) {
			memoryConfiguration.removeValue(key);
		} else {
			memoryConfiguration.setValue(key, value);
		}

		if (!overrides.resource) {
			this._consolidatedConfiguration = null;
		}
	}

	inspect<C>(key: string, overrides: IConfigurationOverrides): IConfigurationValue<C> {
		const consolidateConfigurationModel = this.getConsolidateConfigurationModel(overrides);
		const memoryConfigurationModel = overrides.resource ? this._memoryConfigurationByResource.get(overrides.resource) || this._memoryConfiguration : this._memoryConfiguration;

		const defaultValue = overrides.overrideIdentifier ? this._defaultConfiguration.freeze().override(overrides.overrideIdentifier).getValue<C>(key) : this._defaultConfiguration.freeze().getValue<C>(key);
		const userValue = overrides.overrideIdentifier ? this.userConfiguration.freeze().override(overrides.overrideIdentifier).getValue<C>(key) : this.userConfiguration.freeze().getValue<C>(key);
		const userLocalValue = overrides.overrideIdentifier ? this.localUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue<C>(key) : this.localUserConfiguration.freeze().getValue<C>(key);
		const userRemoteValue = overrides.overrideIdentifier ? this.remoteUserConfiguration.freeze().override(overrides.overrideIdentifier).getValue<C>(key) : this.remoteUserConfiguration.freeze().getValue<C>(key);
		const memoryValue = overrides.overrideIdentifier ? memoryConfigurationModel.override(overrides.overrideIdentifier).getValue<C>(key) : memoryConfigurationModel.getValue<C>(key);
		const value = consolidateConfigurationModel.getValue<C>(key);
		const overrideIdentifiers: string[] = arrays.distinct(arrays.flatten(consolidateConfigurationModel.overrides.map(override => override.identifiers))).filter(overrideIdentifier => consolidateConfigurationModel.getOverrideValue(key, overrideIdentifier) !== undefined);

		return {
			defaultValue: defaultValue,
			userValue: userValue,
			userLocalValue: userLocalValue,
			userRemoteValue: userRemoteValue,
			memoryValue: memoryValue,
			value,

			default: defaultValue !== undefined ? { value: this._defaultConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this._defaultConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
			user: userValue !== undefined ? { value: this.userConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.userConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
			userLocal: userLocalValue !== undefined ? { value: this.localUserConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.localUserConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
			userRemote: userRemoteValue !== undefined ? { value: this.remoteUserConfiguration.freeze().getValue(key), override: overrides.overrideIdentifier ? this.remoteUserConfiguration.freeze().getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,
			memory: memoryValue !== undefined ? { value: memoryConfigurationModel.getValue(key), override: overrides.overrideIdentifier ? memoryConfigurationModel.getOverrideValue(key, overrides.overrideIdentifier) : undefined } : undefined,

			overrideIdentifiers: overrideIdentifiers.length ? overrideIdentifiers : undefined
		};
	}

	keys(): {
		default: string[];
		user: string[];
	} {
		return {
			default: this._defaultConfiguration.freeze().keys,
			user: this.userConfiguration.freeze().keys,
		};
	}

	updateDefaultConfiguration(defaultConfiguration: ConfigurationModel): void {
		this._defaultConfiguration = defaultConfiguration;
		this._consolidatedConfiguration = null;
		this._foldersConsolidatedConfigurations.clear();
	}

	updateLocalUserConfiguration(localUserConfiguration: ConfigurationModel): void {
		this._localUserConfiguration = localUserConfiguration;
		this._userConfiguration = null;
		this._consolidatedConfiguration = null;
		this._foldersConsolidatedConfigurations.clear();
	}

	updateRemoteUserConfiguration(remoteUserConfiguration: ConfigurationModel): void {
		this._remoteUserConfiguration = remoteUserConfiguration;
		this._userConfiguration = null;
		this._consolidatedConfiguration = null;
		this._foldersConsolidatedConfigurations.clear();
	}

	updateFolderConfiguration(resource: URI, configuration: ConfigurationModel): void {
		this._folderConfigurations.set(resource, configuration);
		this._foldersConsolidatedConfigurations.delete(resource);
	}

	deleteFolderConfiguration(resource: URI): void {
		this.folderConfigurations.delete(resource);
		this._foldersConsolidatedConfigurations.delete(resource);
	}

	compareAndUpdateDefaultConfiguration(defaults: ConfigurationModel, keys: string[]): IConfigurationChange {
		const overrides: [string, string[]][] = keys
			.filter(key => OVERRIDE_PROPERTY_PATTERN.test(key))
			.map(key => {
				const overrideIdentifier = overrideIdentifierFromKey(key);
				const fromKeys = this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier);
				const toKeys = defaults.getKeysForOverrideIdentifier(overrideIdentifier);
				const keys = [
					...toKeys.filter(key => fromKeys.indexOf(key) === -1),
					...fromKeys.filter(key => toKeys.indexOf(key) === -1),
					...fromKeys.filter(key => !objects.equals(this._defaultConfiguration.override(overrideIdentifier).getValue(key), defaults.override(overrideIdentifier).getValue(key)))
				];
				return [overrideIdentifier, keys];
			});
		this.updateDefaultConfiguration(defaults);
		return { keys, overrides };
	}

	compareAndUpdateLocalUserConfiguration(user: ConfigurationModel): IConfigurationChange {
		const { added, updated, removed, overrides } = compare(this.localUserConfiguration, user);
		const keys = [...added, ...updated, ...removed];
		if (keys.length) {
			this.updateLocalUserConfiguration(user);
		}
		return { keys, overrides };
	}

	compareAndUpdateRemoteUserConfiguration(user: ConfigurationModel): IConfigurationChange {
		const { added, updated, removed, overrides } = compare(this.remoteUserConfiguration, user);
		let keys = [...added, ...updated, ...removed];
		if (keys.length) {
			this.updateRemoteUserConfiguration(user);
		}
		return { keys, overrides };
	}

	compareAndUpdateFolderConfiguration(resource: URI, folderConfiguration: ConfigurationModel): IConfigurationChange {
		const currentFolderConfiguration = this.folderConfigurations.get(resource);
		const { added, updated, removed, overrides } = compare(currentFolderConfiguration, folderConfiguration);
		let keys = [...added, ...updated, ...removed];
		if (keys.length || !currentFolderConfiguration) {
			this.updateFolderConfiguration(resource, folderConfiguration);
		}
		return { keys, overrides };
	}

	compareAndDeleteFolderConfiguration(folder: URI): IConfigurationChange {
		const folderConfig = this.folderConfigurations.get(folder);
		if (!folderConfig) {
			throw new Error('Unknown folder');
		}
		this.deleteFolderConfiguration(folder);
		const { added, updated, removed, overrides } = compare(folderConfig, undefined);
		return { keys: [...added, ...updated, ...removed], overrides };
	}

	get defaults(): ConfigurationModel {
		return this._defaultConfiguration;
	}

	private _userConfiguration: ConfigurationModel | null = null;
	get userConfiguration(): ConfigurationModel {
		if (!this._userConfiguration) {
			this._userConfiguration = this._remoteUserConfiguration.isEmpty() ? this._localUserConfiguration : this._localUserConfiguration.merge(this._remoteUserConfiguration);
			if (this._freeze) {
				this._userConfiguration.freeze();
			}
		}
		return this._userConfiguration;
	}

	get localUserConfiguration(): ConfigurationModel {
		return this._localUserConfiguration;
	}

	get remoteUserConfiguration(): ConfigurationModel {
		return this._remoteUserConfiguration;
	}

	protected get folderConfigurations(): ResourceMap<ConfigurationModel> {
		return this._folderConfigurations;
	}

	private getConsolidateConfigurationModel(overrides: IConfigurationOverrides): ConfigurationModel {
		let configurationModel = this.getConsolidatedConfigurationModelForResource(overrides);
		return overrides.overrideIdentifier ? configurationModel.override(overrides.overrideIdentifier) : configurationModel;
	}

	private getConsolidatedConfigurationModelForResource({ resource }: IConfigurationOverrides): ConfigurationModel {
		let consolidateConfiguration = this.getConsolidatedConfiguration();

		return consolidateConfiguration;
	}

	private getConsolidatedConfiguration(): ConfigurationModel {
		if (!this._consolidatedConfiguration) {
			this._consolidatedConfiguration = this._defaultConfiguration.merge(this.userConfiguration, this._memoryConfiguration);
		}
		return this._consolidatedConfiguration;
	}

	toData(): IConfigurationData {
		return {
			defaults: {
				contents: this._defaultConfiguration.contents,
				overrides: this._defaultConfiguration.overrides,
				keys: this._defaultConfiguration.keys
			},
			user: {
				contents: this.userConfiguration.contents,
				overrides: this.userConfiguration.overrides,
				keys: this.userConfiguration.keys
			},
			folders: [...this._folderConfigurations.keys()].reduce<[UriComponents, IConfigurationModel][]>((result, folder) => {
				const { contents, overrides, keys } = this._folderConfigurations.get(folder)!;
				result.push([folder, { contents, overrides, keys }]);
				return result;
			}, [])
		};
	}

	allKeys(): string[] {
		const keys: Set<string> = new Set<string>();
		this._defaultConfiguration.freeze().keys.forEach(key => keys.add(key));
		this.userConfiguration.freeze().keys.forEach(key => keys.add(key));
		this._folderConfigurations.forEach(folderConfiguraiton => folderConfiguraiton.freeze().keys.forEach(key => keys.add(key)));
		return [...keys.values()];
	}

	protected getAllKeysForOverrideIdentifier(overrideIdentifier: string): string[] {
		const keys: Set<string> = new Set<string>();
		this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
		this.userConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
		this._folderConfigurations.forEach(folderConfiguraiton => folderConfiguraiton.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key)));
		return [...keys.values()];
	}

	static parse(data: IConfigurationData): Configuration {
		const defaultConfiguration = this.parseConfigurationModel(data.defaults);
		const userConfiguration = this.parseConfigurationModel(data.user);
		const folders: ResourceMap<ConfigurationModel> = data.folders.reduce((result, value) => {
			result.set(URI.revive(value[0]), this.parseConfigurationModel(value[1]));
			return result;
		}, new ResourceMap<ConfigurationModel>());
		return new Configuration(defaultConfiguration, userConfiguration, new ConfigurationModel(), folders, new ConfigurationModel(), new ResourceMap<ConfigurationModel>(), false);
	}

	private static parseConfigurationModel(model: IConfigurationModel): ConfigurationModel {
		return new ConfigurationModel(model.contents, model.keys, model.overrides).freeze();
	}

}

export function mergeChanges(...changes: IConfigurationChange[]): IConfigurationChange {
	if (changes.length === 0) {
		return { keys: [], overrides: [] };
	}
	if (changes.length === 1) {
		return changes[0];
	}
	const keysSet = new Set<string>();
	const overridesMap = new Map<string, Set<string>>();
	for (const change of changes) {
		change.keys.forEach(key => keysSet.add(key));
		change.overrides.forEach(([identifier, keys]) => {
			const result = getOrSet(overridesMap, identifier, new Set<string>());
			keys.forEach(key => result.add(key));
		});
	}
	const overrides: [string, string[]][] = [];
	overridesMap.forEach((keys, identifier) => overrides.push([identifier, [...keys.values()]]));
	return { keys: [...keysSet.values()], overrides };
}

export class ConfigurationChangeEvent implements IConfigurationChangeEvent {

	private readonly affectedKeysTree: any;
	readonly affectedKeys: string[];
	source!: ConfigurationTarget;
	sourceConfig: any;

	constructor(readonly change: IConfigurationChange, private readonly previous: { data: IConfigurationData } | undefined, private readonly currentConfiguraiton: Configuration) {
		const keysSet = new Set<string>();
		change.keys.forEach(key => keysSet.add(key));
		change.overrides.forEach(([, keys]) => keys.forEach(key => keysSet.add(key)));
		this.affectedKeys = [...keysSet.values()];

		const configurationModel = new ConfigurationModel();
		this.affectedKeys.forEach(key => configurationModel.setValue(key, {}));
		this.affectedKeysTree = configurationModel.contents;
	}

	private _previousConfiguration: Configuration | undefined = undefined;
	get previousConfiguration(): Configuration | undefined {
		if (!this._previousConfiguration && this.previous) {
			this._previousConfiguration = Configuration.parse(this.previous.data);
		}
		return this._previousConfiguration;
	}

	affectsConfiguration(section: string, overrides?: IConfigurationOverrides): boolean {
		if (this.doesAffectedKeysTreeContains(this.affectedKeysTree, section)) {
			if (overrides) {
				const value1 = this.previousConfiguration ? this.previousConfiguration.getValue(section, overrides) : undefined;
				const value2 = this.currentConfiguraiton.getValue(section, overrides);
				return !objects.equals(value1, value2);
			}
			return true;
		}
		return false;
	}

	private doesAffectedKeysTreeContains(affectedKeysTree: any, section: string): boolean {
		let requestedTree = toValuesTree({ [section]: true }, () => { });

		let key;
		while (typeof requestedTree === 'object' && (key = Object.keys(requestedTree)[0])) { // Only one key should present, since we added only one property
			affectedKeysTree = affectedKeysTree[key];
			if (!affectedKeysTree) {
				return false; // Requested tree is not found
			}
			requestedTree = requestedTree[key];
		}
		return true;
	}
}

export class AllKeysConfigurationChangeEvent extends ConfigurationChangeEvent {
	constructor(configuration: Configuration, source: ConfigurationTarget, sourceConfig: any) {
		super({ keys: configuration.allKeys(), overrides: [] }, undefined, configuration);
		this.source = source;
		this.sourceConfig = sourceConfig;
	}
}
