/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { isWindows, isMacintosh, setImmediate, globals, INodeProcess } from 'bg/base/common/platform';

let safeProcess: INodeProcess & { nextTick: (callback: (...args: any[]) => void) => void; };
declare const process: INodeProcess;

// Native sandbox environment
if (typeof globals.biggain !== 'undefined' && typeof globals.biggain.process !== 'undefined') {
	const sandboxProcess: INodeProcess = globals.biggain.process;
	safeProcess = {
		get platform() { return sandboxProcess.platform; },
		get env() { return sandboxProcess.env; },
		cwd() { return sandboxProcess.cwd(); },
		nextTick(callback: (...args: any[]) => void): void { return setImmediate(callback); }
	};
}

// Native node.js environment
else if (typeof process !== 'undefined') {
	safeProcess = {
		get platform() { return process.platform; },
		get env() { return process.env; },
		cwd() { return process.env['BIGGAIN_CWD'] || process.cwd(); },
		nextTick(callback: (...args: any[]) => void): void { return process.nextTick!(callback); }
	};
}

// Web environment
else {
	safeProcess = {

		// Supported
		get platform() { return isWindows ? 'win32' : isMacintosh ? 'darwin' : 'linux'; },
		nextTick(callback: (...args: any[]) => void): void { return setImmediate(callback); },

		// Unsupported
		get env() { return {}; },
		cwd() { return '/'; }
	};
}

/**
 * Provides safe access to the `cwd` property in node.js, sandboxed or web
 * environments.
 *
 * Note: in web, this property is hardcoded to be `/`.
 */
export const cwd = safeProcess.cwd;

/**
 * Provides safe access to the `env` property in node.js, sandboxed or web
 * environments.
 *
 * Note: in web, this property is hardcoded to be `{}`.
 */
export const env = safeProcess.env;

/**
 * Provides safe access to the `platform` property in node.js, sandboxed or web
 * environments.
 */
export const platform = safeProcess.platform;

/**
 * Provides safe access to the `nextTick` method in node.js, sandboxed or web
 * environments.
 */
export const nextTick = safeProcess.nextTick;
