/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { TernarySearchTree } from 'bg/base/common/map';
import { URI } from 'bg/base/common/uri';
import { getConfigurationKeys, IConfigurationOverrides, IConfigurationService, getConfigurationValue, isConfigurationOverrides, IConfigurationValue } from 'bg/platform/configuration/common/configuration';
import { Emitter } from 'bg/base/common/event';

export class TestConfigurationService implements IConfigurationService {
	public _serviceBrand: undefined;

	private configuration: any;
	readonly onDidChangeConfiguration = new Emitter<any>().event;

	constructor(configuration?: any) {
		this.configuration = configuration || Object.create(null);
	}

	private configurationByRoot: TernarySearchTree<string, any> = TernarySearchTree.forPaths<any>();

	public reloadConfiguration<T>(): Promise<T> {
		return Promise.resolve(this.getValue());
	}

	public getValue(arg1?: any, arg2?: any): any {
		let configuration;
		const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : undefined;
		if (overrides) {
			if (overrides.resource) {
				configuration = this.configurationByRoot.findSubstr(overrides.resource.fsPath);
			}
		}
		configuration = configuration ? configuration : this.configuration;
		if (arg1 && typeof arg1 === 'string') {
			return getConfigurationValue(configuration, arg1);
		}
		return configuration;
	}

	public updateValue(key: string, value: any): Promise<void> {
		return Promise.resolve(undefined);
	}

	public setUserConfiguration(key: any, value: any, root?: URI): Promise<void> {
		if (root) {
			const configForRoot = this.configurationByRoot.get(root.fsPath) || Object.create(null);
			configForRoot[key] = value;
			this.configurationByRoot.set(root.fsPath, configForRoot);
		} else {
			this.configuration[key] = value;
		}

		return Promise.resolve(undefined);
	}

	public inspect<T>(key: string, overrides?: IConfigurationOverrides): IConfigurationValue<T> {
		const config = this.getValue(undefined, overrides);

		return {
			value: getConfigurationValue<T>(config, key),
			defaultValue: getConfigurationValue<T>(config, key),
			userValue: getConfigurationValue<T>(config, key)
		};
	}

	public keys() {
		return {
			default: getConfigurationKeys(),
			user: Object.keys(this.configuration),
			workspace: [],
			workspaceFolder: []
		};
	}

	public getConfigurationData() {
		return null;
	}
}
