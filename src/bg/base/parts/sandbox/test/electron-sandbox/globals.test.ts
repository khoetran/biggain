/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { ipcRenderer, webFrame, context, process } from 'bg/base/parts/sandbox/electron-sandbox/globals';

suite('Sandbox', () => {
	test('globals', async () => {
		assert.ok(typeof ipcRenderer.send === 'function');
		assert.ok(typeof webFrame.setZoomLevel === 'function');
		assert.ok(typeof process.platform === 'string');

		const config = await context.resolveConfiguration();
		assert.ok(config);
		assert.ok(context.configuration());
	});
});
