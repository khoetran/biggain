/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IProductService } from 'bg/platform/product/common/productService';
import { IDebugParams, IExtensionHostDebugParams, INativeEnvironmentService } from 'bg/platform/environment/common/environment';
import { NativeParsedArgs } from 'bg/platform/environment/common/argv';
import { dirname, join, normalize, resolve } from 'bg/base/common/path';
import { joinPath } from 'bg/base/common/resources';
import { memoize } from 'bg/base/common/decorators';
import { toLocalISOString } from 'bg/base/common/date';
import { FileAccess } from 'bg/base/common/network';
import { URI } from 'bg/base/common/uri';
import { env } from 'bg/base/common/process';

export interface INativeEnvironmentPaths {

	/**
	 * The user data directory to use for anything that should be
	 * persisted except for the content that is meant for the `homeDir`.
	 *
	 * Only one instance of BigGain can use the same `userDataDir`.
	 */
	userDataDir: string

	/**
	 * The user home directory mainly used for persisting extensions
	 * and global configuration that should be shared across all
	 * versions.
	 */
	homeDir: string;

	/**
	 * OS tmp dir.
	 */
	tmpDir: string,
}

export abstract class AbstractNativeEnvironmentService implements INativeEnvironmentService {

	declare readonly _serviceBrand: undefined;

	@memoize
	get appRoot(): string { return dirname(FileAccess.asFileUri('', require).fsPath); }

	@memoize
	get userHome(): URI { return URI.file(this.paths.homeDir); }

	@memoize
	get userDataPath(): string { return this.paths.userDataDir; }

	@memoize
	get appSettingsHome(): URI { return URI.file(join(this.userDataPath, 'User')); }

	@memoize
	get tmpDir(): URI { return URI.file(this.paths.tmpDir); }

	@memoize
	get userRoamingDataHome(): URI { return this.appSettingsHome; }

	@memoize
	get settingsResource(): URI { return joinPath(this.userRoamingDataHome, 'settings.json'); }

	@memoize
	get userDataSyncHome(): URI { return joinPath(this.userRoamingDataHome, 'sync'); }

	get logsPath(): string {
		if (!this.args.logsPath) {
			const key = toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '');
			this.args.logsPath = join(this.userDataPath, 'logs', key);
		}

		return this.args.logsPath;
	}

	@memoize
	get userDataSyncLogResource(): URI { return URI.file(join(this.logsPath, 'userDataSync.log')); }

	@memoize
	get sync(): 'on' | 'off' | undefined { return this.args.sync; }

	@memoize
	get machineSettingsResource(): URI { return joinPath(URI.file(join(this.userDataPath, 'Machine')), 'settings.json'); }

	@memoize
	get globalStorageHome(): URI { return URI.joinPath(this.appSettingsHome, 'globalStorage'); }

	@memoize
	get workspaceStorageHome(): URI { return URI.joinPath(this.appSettingsHome, 'workspaceStorage'); }

	@memoize
	get keybindingsResource(): URI { return joinPath(this.userRoamingDataHome, 'keybindings.json'); }

	@memoize
	get keyboardLayoutResource(): URI { return joinPath(this.userRoamingDataHome, 'keyboardLayout.json'); }

	@memoize
	get argvResource(): URI {
		const biggainPortable = env['BIGGAIN_PORTABLE'];
		if (biggainPortable) {
			return URI.file(join(biggainPortable, 'argv.json'));
		}

		return joinPath(this.userHome, this.productService.dataFolderName, 'argv.json');
	}

	@memoize
	get snippetsHome(): URI { return joinPath(this.userRoamingDataHome, 'snippets'); }

	@memoize
	get isExtensionDevelopment(): boolean { return !!this.args.extensionDevelopmentPath; }

	@memoize
	get untitledWorkspacesHome(): URI { return URI.file(join(this.userDataPath, 'Workspaces')); }

	@memoize
	get installSourcePath(): string { return join(this.userDataPath, 'installSource'); }

	@memoize
	get builtinExtensionsPath(): string {
		const cliBuiltinExtensionsDir = this.args['builtin-extensions-dir'];
		if (cliBuiltinExtensionsDir) {
			return resolve(cliBuiltinExtensionsDir);
		}

		return normalize(join(FileAccess.asFileUri('', require).fsPath, '..', 'extensions'));
	}

	get extensionsDownloadPath(): string {
		const cliExtensionsDownloadDir = this.args['extensions-download-dir'];
		if (cliExtensionsDownloadDir) {
			return resolve(cliExtensionsDownloadDir);
		}

		return join(this.userDataPath, 'CachedExtensionVSIXs');
	}

	@memoize
	get extensionsPath(): string {
		const cliExtensionsDir = this.args['extensions-dir'];
		if (cliExtensionsDir) {
			return resolve(cliExtensionsDir);
		}

		const biggainExtensions = env['BIGGAIN_EXTENSIONS'];
		if (biggainExtensions) {
			return biggainExtensions;
		}

		const biggainPortable = env['BIGGAIN_PORTABLE'];
		if (biggainPortable) {
			return join(biggainPortable, 'extensions');
		}

		return joinPath(this.userHome, this.productService.dataFolderName, 'extensions').fsPath;
	}

	@memoize
	get extensionDevelopmentLocationURI(): URI[] | undefined {
		const extensionDevelopmentPaths = this.args.extensionDevelopmentPath;
		if (Array.isArray(extensionDevelopmentPaths)) {
			return extensionDevelopmentPaths.map(extensionDevelopmentPath => {
				if (/^[^:/?#]+?:\/\//.test(extensionDevelopmentPath)) {
					return URI.parse(extensionDevelopmentPath);
				}

				return URI.file(normalize(extensionDevelopmentPath));
			});
		}

		return undefined;
	}

	@memoize
	get debugExtensionHost(): IExtensionHostDebugParams { return parseExtensionHostPort(this.args, this.isBuilt); }
	get debugRenderer(): boolean { return !!this.args.debugRenderer; }

	get isBuilt(): boolean { return !env['BIGGAIN_DEV']; }
	get verbose(): boolean { return !!this.args.verbose; }
	get logLevel(): string | undefined { return this.args.log; }

	@memoize
	get serviceMachineIdResource(): URI { return joinPath(URI.file(this.userDataPath), 'machineid'); }

	get crashReporterId(): string | undefined { return this.args['crash-reporter-id']; }
	get crashReporterDirectory(): string | undefined { return this.args['crash-reporter-directory']; }

	get driverHandle(): string | undefined { return this.args['driver']; }

	@memoize
	get telemetryLogResource(): URI { return URI.file(join(this.logsPath, 'telemetry.log')); }
	get disableTelemetry(): boolean { return !!this.args['disable-telemetry']; }

	@memoize
	get disableWorkspaceTrust(): boolean { return !!this.args['disable-workspace-trust']; }

	get args(): NativeParsedArgs { return this._args; }

	constructor(
		private readonly _args: NativeParsedArgs,
		private readonly paths: INativeEnvironmentPaths,
		protected readonly productService: IProductService
	) { }
}

export function parseExtensionHostPort(args: NativeParsedArgs, isBuild: boolean): IExtensionHostDebugParams {
	return parseDebugPort(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuild, args.debugId);
}

export function parseSearchPort(args: NativeParsedArgs, isBuild: boolean): IDebugParams {
	return parseDebugPort(args['inspect-search'], args['inspect-brk-search'], 5876, isBuild);
}

function parseDebugPort(debugArg: string | undefined, debugBrkArg: string | undefined, defaultBuildPort: number, isBuild: boolean, debugId?: string): IExtensionHostDebugParams {
	const portStr = debugBrkArg || debugArg;
	const port = Number(portStr) || (!isBuild ? defaultBuildPort : null);
	const brk = port ? Boolean(!!debugBrkArg) : false;

	return { port, break: brk, debugId };
}
