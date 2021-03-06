/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'bg/platform/registry/common/platform';
import { IConfigurationRegistry, Extensions } from 'bg/platform/configuration/common/configurationRegistry';
import { IDisposable, Disposable } from 'bg/base/common/lifecycle';
import { IConfigurationService, IConfigurationChangeEvent, IConfigurationOverrides, ConfigurationTarget, isConfigurationOverrides, IConfigurationData, IConfigurationValue, IConfigurationChange } from 'bg/platform/configuration/common/configuration';
import { DefaultConfigurationModel, Configuration, ConfigurationModel, ConfigurationChangeEvent, UserSettings } from 'bg/platform/configuration/common/configurationModels';
import { Event, Emitter } from 'bg/base/common/event';
import { URI } from 'bg/base/common/uri';
import { IFileService } from 'bg/platform/files/common/files';
import { RunOnceScheduler } from 'bg/base/common/async';
import { extUriBiasedIgnorePathCase } from 'bg/base/common/resources';

export class ConfigurationService extends Disposable implements IConfigurationService, IDisposable {

	declare readonly _serviceBrand: undefined;

	private configuration: Configuration;
	private userConfiguration: UserSettings;
	private readonly reloadConfigurationScheduler: RunOnceScheduler;

	private readonly _onDidChangeConfiguration: Emitter<IConfigurationChangeEvent> = this._register(new Emitter<IConfigurationChangeEvent>());
	readonly onDidChangeConfiguration: Event<IConfigurationChangeEvent> = this._onDidChangeConfiguration.event;

	constructor(
		private readonly settingsResource: URI,
		fileService: IFileService
	) {
		super();
		this.userConfiguration = this._register(new UserSettings(this.settingsResource, undefined, extUriBiasedIgnorePathCase, fileService));
		this.configuration = new Configuration(new DefaultConfigurationModel(), new ConfigurationModel());

		this.reloadConfigurationScheduler = this._register(new RunOnceScheduler(() => this.reloadConfiguration(), 50));
		this._register(Registry.as<IConfigurationRegistry>(Extensions.Configuration).onDidUpdateConfiguration(configurationProperties => this.onDidDefaultConfigurationChange(configurationProperties)));
		this._register(this.userConfiguration.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
	}

	async initialize(): Promise<void> {
		const userConfiguration = await this.userConfiguration.loadConfiguration();
		this.configuration = new Configuration(new DefaultConfigurationModel(), userConfiguration);
	}

	getConfigurationData(): IConfigurationData {
		return this.configuration.toData();
	}

	getValue<T>(): T;
	getValue<T>(section: string): T;
	getValue<T>(overrides: IConfigurationOverrides): T;
	getValue<T>(section: string, overrides: IConfigurationOverrides): T;
	getValue(arg1?: any, arg2?: any): any {
		const section = typeof arg1 === 'string' ? arg1 : undefined;
		const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
		return this.configuration.getValue(section, overrides);
	}

	updateValue(key: string, value: any): Promise<void>;
	updateValue(key: string, value: any, overrides: IConfigurationOverrides): Promise<void>;
	updateValue(key: string, value: any, target: ConfigurationTarget): Promise<void>;
	updateValue(key: string, value: any, overrides: IConfigurationOverrides, target: ConfigurationTarget): Promise<void>;
	updateValue(key: string, value: any, arg3?: any, arg4?: any): Promise<void> {
		return Promise.reject(new Error('not supported'));
	}

	inspect<T>(key: string): IConfigurationValue<T> {
		return this.configuration.inspect<T>(key, {});
	}

	keys(): {
		default: string[];
		user: string[];
	} {
		return this.configuration.keys();
	}

	async reloadConfiguration(): Promise<void> {
		const configurationModel = await this.userConfiguration.loadConfiguration();
		this.onDidChangeUserConfiguration(configurationModel);
	}

	private onDidChangeUserConfiguration(userConfigurationModel: ConfigurationModel): void {
		const previous = this.configuration.toData();
		const change = this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
		this.trigger(change, previous, ConfigurationTarget.USER);
	}

	private onDidDefaultConfigurationChange(keys: string[]): void {
		const previous = this.configuration.toData();
		const change = this.configuration.compareAndUpdateDefaultConfiguration(new DefaultConfigurationModel(), keys);
		this.trigger(change, previous, ConfigurationTarget.DEFAULT);
	}

	private trigger(configurationChange: IConfigurationChange, previous: IConfigurationData, source: ConfigurationTarget): void {
		const event = new ConfigurationChangeEvent(configurationChange, { data: previous }, this.configuration);
		event.source = source;
		event.sourceConfig = this.getTargetConfiguration(source);
		this._onDidChangeConfiguration.fire(event);
	}

	private getTargetConfiguration(target: ConfigurationTarget): any {
		switch (target) {
			case ConfigurationTarget.DEFAULT:
				return this.configuration.defaults.contents;
			case ConfigurationTarget.USER:
				return this.configuration.localUserConfiguration.contents;
		}
		return {};
	}
}
