/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { join } from 'bg/base/common/path';
import { memoize } from 'bg/base/common/decorators';
import { refineServiceDecorator } from 'bg/platform/instantiation/common/instantiation';
import { IEnvironmentService, INativeEnvironmentService } from 'bg/platform/environment/common/environment';
import { NativeEnvironmentService } from 'bg/platform/environment/node/environmentService';
import { createStaticIPCHandle } from 'bg/base/parts/ipc/node/ipc.net';

export const IEnvironmentMainService = refineServiceDecorator<IEnvironmentService, IEnvironmentMainService>(IEnvironmentService);

/**
 * A subclass of the `INativeEnvironmentService` to be used only in electron-main
 * environments.
 */
export interface IEnvironmentMainService extends INativeEnvironmentService {

	// --- NLS cache path
	cachedLanguagesPath: string;

	// --- backup paths
	backupHome: string;
	backupWorkspacesPath: string;

	// --- V8 code cache path
	codeCachePath?: string;

	// --- IPC
	mainIPCHandle: string;
	mainLockfile: string;

	// --- config
	sandbox: boolean;
	driverVerbose: boolean;
	disableUpdates: boolean;
	disableKeytar: boolean;
}

export class EnvironmentMainService extends NativeEnvironmentService implements IEnvironmentMainService {

	@memoize
	get cachedLanguagesPath(): string { return join(this.userDataPath, 'clp'); }

	@memoize
	get backupHome(): string { return join(this.userDataPath, 'Backups'); }

	@memoize
	get backupWorkspacesPath(): string { return join(this.backupHome, 'workspaces.json'); }

	@memoize
	get mainIPCHandle(): string { return createStaticIPCHandle(this.userDataPath, 'main', this.productService.version); }

	@memoize
	get mainLockfile(): string { return join(this.userDataPath, 'code.lock'); }

	@memoize
	get sandbox(): boolean { return !!this.args['__sandbox']; }

	@memoize
	get driverVerbose(): boolean { return !!this.args['driver-verbose']; }

	@memoize
	get disableUpdates(): boolean { return !!this.args['disable-updates']; }

	@memoize
	get disableKeytar(): boolean { return !!this.args['disable-keytar']; }

	@memoize
	get codeCachePath(): string | undefined { return process.env['BIGGAIN_CODE_CACHE_PATH'] || undefined; }
}
