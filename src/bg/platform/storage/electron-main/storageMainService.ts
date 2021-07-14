/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { once } from 'bg/base/common/functional';
import { Disposable } from 'bg/base/common/lifecycle';
import { IEnvironmentService } from 'bg/platform/environment/common/environment';
import { createDecorator } from 'bg/platform/instantiation/common/instantiation';
import { ILifecycleMainService, LifecycleMainPhase } from 'bg/platform/lifecycle/electron-main/lifecycleMainService';
import { ILogService } from 'bg/platform/log/common/log';
import { GlobalStorageMain, IStorageMain, IStorageMainOptions } from 'bg/platform/storage/electron-main/storageMain';

export const IStorageMainService = createDecorator<IStorageMainService>('storageMainService');

export interface IStorageMainService {

	readonly _serviceBrand: undefined;

	/**
	 * Provides access to the global storage shared across all windows.
	 */
	readonly globalStorage: IStorageMain;
}

export class StorageMainService extends Disposable implements IStorageMainService {

	declare readonly _serviceBrand: undefined;

	constructor(
		@ILogService private readonly logService: ILogService,
		@IEnvironmentService private readonly environmentService: IEnvironmentService,
		@ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService
	) {
		super();

		this.registerListeners();
	}

	protected getStorageOptions(): IStorageMainOptions {
		return {
			useInMemoryStorage: false
		};
	}

	private registerListeners(): void {

		// Global Storage: Warmup when any window opens
		(async () => {
			await this.lifecycleMainService.when(LifecycleMainPhase.AfterWindowOpen);

			this.globalStorage.init();
		})();

		// All Storage: Close when shutting down
		this._register(this.lifecycleMainService.onWillShutdown(e => {

			// Global Storage
			e.join(this.globalStorage.close());
		}));
	}

	//#region Global Storage

	readonly globalStorage = this.createGlobalStorage();

	private createGlobalStorage(): IStorageMain {
		if (this.globalStorage) {
			return this.globalStorage; // only once
		}

		this.logService.trace(`StorageMainService: creating global storage`);

		const globalStorage = new GlobalStorageMain(this.getStorageOptions(), this.logService, this.environmentService);

		once(globalStorage.onDidCloseStorage)(() => {
			this.logService.trace(`StorageMainService: closed global storage`);
		});

		return globalStorage;
	}

	//#endregion
}
