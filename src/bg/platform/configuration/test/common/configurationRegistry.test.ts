/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { Registry } from 'bg/platform/registry/common/platform';
import { IConfigurationRegistry, Extensions as ConfigurationExtensions } from 'bg/platform/configuration/common/configurationRegistry';

suite('ConfigurationRegistry', () => {

	const configurationRegistry = Registry.as<IConfigurationRegistry>(ConfigurationExtensions.Configuration);

	test('configuration override', async () => {
		configurationRegistry.registerConfiguration({
			'id': '_test_default',
			'type': 'object',
			'properties': {
				'config': {
					'type': 'object',
				}
			}
		});
		configurationRegistry.registerDefaultConfigurations([{ 'config': { a: 1, b: 2 } }]);
		configurationRegistry.registerDefaultConfigurations([{ '[lang]': { a: 2, c: 3 } }]);

		assert.deepStrictEqual(configurationRegistry.getConfigurationProperties()['config'].default, { a: 1, b: 2 });
		assert.deepStrictEqual(configurationRegistry.getConfigurationProperties()['[lang]'].default, { a: 2, c: 3 });
	});

	test('configuration override defaults - merges defaults', async () => {
		configurationRegistry.registerDefaultConfigurations([{ '[lang]': { a: 1, b: 2 } }]);
		configurationRegistry.registerDefaultConfigurations([{ '[lang]': { a: 2, c: 3 } }]);

		assert.deepStrictEqual(configurationRegistry.getConfigurationProperties()['[lang]'].default, { a: 2, b: 2, c: 3 });
	});

	test('configuration defaults - overrides defaults', async () => {
		configurationRegistry.registerConfiguration({
			'id': '_test_default',
			'type': 'object',
			'properties': {
				'config': {
					'type': 'object',
				}
			}
		});
		configurationRegistry.registerDefaultConfigurations([{ 'config': { a: 1, b: 2 } }]);
		configurationRegistry.registerDefaultConfigurations([{ 'config': { a: 2, c: 3 } }]);

		assert.deepStrictEqual(configurationRegistry.getConfigurationProperties()['config'].default, { a: 2, c: 3 });
	});
});
