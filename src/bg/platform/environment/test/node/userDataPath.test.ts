/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { OPTIONS, parseArgs } from 'bg/platform/environment/node/argv';
import { getUserDataPath } from 'bg/platform/environment/node/userDataPath';

suite('User data path', () => {

	test('getUserDataPath - default', () => {
		const path = getUserDataPath(parseArgs(process.argv, OPTIONS));
		assert.ok(path.length > 0);
	});

	test('getUserDataPath - portable mode', () => {
		const origPortable = process.env['BIGGAIN_PORTABLE'];
		try {
			const portableDir = 'portable-dir';
			process.env['BIGGAIN_PORTABLE'] = portableDir;

			const path = getUserDataPath(parseArgs(process.argv, OPTIONS));
			assert.ok(path.includes(portableDir));
		} finally {
			if (typeof origPortable === 'string') {
				process.env['BIGGAIN_PORTABLE'] = origPortable;
			} else {
				delete process.env['BIGGAIN_PORTABLE'];
			}
		}
	});

	test('getUserDataPath - --user-data-dir', () => {
		const cliUserDataDir = 'cli-data-dir';
		const args = parseArgs(process.argv, OPTIONS);
		args['user-data-dir'] = cliUserDataDir;

		const path = getUserDataPath(args);
		assert.ok(path.includes(cliUserDataDir));
	});

	test('getUserDataPath - BIGGAIN_APPDATA', () => {
		const origAppData = process.env['BIGGAIN_APPDATA'];
		try {
			const appDataDir = 'appdata-dir';
			process.env['BIGGAIN_APPDATA'] = appDataDir;

			const path = getUserDataPath(parseArgs(process.argv, OPTIONS));
			assert.ok(path.includes(appDataDir));
		} finally {
			if (typeof origAppData === 'string') {
				process.env['BIGGAIN_APPDATA'] = origAppData;
			} else {
				delete process.env['BIGGAIN_APPDATA'];
			}
		}
	});
});
