/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { MIN_MAX_MEMORY_SIZE_MB } from 'bg/platform/files/common/files';
import { parseArgs, ErrorReporter, OPTIONS } from 'bg/platform/environment/node/argv';
import { NativeParsedArgs } from 'bg/platform/environment/common/argv';
import { IProcessEnvironment } from 'bg/base/common/platform';

function parseAndValidate(cmdLineArgs: string[], reportWarnings: boolean): NativeParsedArgs {
	const errorReporter: ErrorReporter = {
		onUnknownOption: (id) => {
			console.warn(`Warning: '${id}' is not in the list of known options, but still passed to Electron/Chromium.`);
		},
		onMultipleValues: (id, val) => {
			console.warn(`Option '${id}' is defined more than once. Using value '${val}.'`);
		}
	};

	const args = parseArgs(cmdLineArgs, OPTIONS, reportWarnings ? errorReporter : undefined);
	if (args.goto) {
		args._.forEach(arg => assert(/^(\w:)?[^:]+(:\d*){0,2}$/.test(arg), "Arguments in `--goto` mode should be in the format of `FILE(:LINE(:CHARACTER))`."));
	}

	if (args['max-memory']) {
		assert(parseInt(args['max-memory']) >= MIN_MAX_MEMORY_SIZE_MB, `The max-memory argument cannot be specified lower than ${MIN_MAX_MEMORY_SIZE_MB} MB.`);
	}

	return args;
}

function stripAppPath(argv: string[]): string[] | undefined {
	const index = argv.findIndex(a => !/^-/.test(a));

	if (index > -1) {
		return [...argv.slice(0, index), ...argv.slice(index + 1)];
	}
	return undefined;
}

/**
 * Use this to parse raw code process.argv such as: `Electron . --verbose --wait`
 */
export function parseMainProcessArgv(processArgv: string[]): NativeParsedArgs {
	let [, ...args] = processArgv;

	// If dev, remove the first non-option argument: it's the app location
	if (process.env['BIGGAIN_DEV']) {
		args = stripAppPath(args) || [];
	}

	// If called from CLI, don't report warnings as they are already reported.
	const reportWarnings = !isLaunchedFromCli(process.env);
	return parseAndValidate(args, reportWarnings);
}

/**
 * Use this to parse raw code CLI process.argv such as: `Electron cli.js . --verbose --wait`
 */
export function parseCLIProcessArgv(processArgv: string[]): NativeParsedArgs {
	const [, , ...args] = processArgv; // remove the first non-option argument: it's always the app location

	return parseAndValidate(args, true);
}

export function addArg(argv: string[], ...args: string[]): string[] {
	const endOfArgsMarkerIndex = argv.indexOf('--');
	if (endOfArgsMarkerIndex === -1) {
		argv.push(...args);
	} else {
		// if the we have an argument "--" (end of argument marker)
		// we cannot add arguments at the end. rather, we add
		// arguments before the "--" marker.
		argv.splice(endOfArgsMarkerIndex, 0, ...args);
	}

	return argv;
}

export function isLaunchedFromCli(env: IProcessEnvironment): boolean {
	return env['BIGGAIN_CLI'] === '1';
}
