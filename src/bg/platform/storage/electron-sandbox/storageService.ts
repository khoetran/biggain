/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { StorageScope, WillSaveStateReason, AbstractStorageService } from 'bg/platform/storage/common/storage';
import { Storage, IStorage } from 'bg/base/parts/storage/common/storage';
import { IEnvironmentService } from 'bg/platform/environment/common/environment';
import { Promises } from 'bg/base/common/async';
import { IMainProcessService } from 'bg/platform/ipc/electron-sandbox/services';
import { StorageDatabaseChannelClient } from 'bg/platform/storage/common/storageIpc';

export class NativeStorageService extends AbstractStorageService {

	// Global Storage is readonly and shared across windows
	private readonly globalStorage: IStorage;

	constructor(
		private readonly mainProcessService: IMainProcessService,
		private readonly environmentService: IEnvironmentService
	) {
		super();

		this.globalStorage = this.createGlobalStorage();
	}

	private createGlobalStorage(): IStorage {
		const storageDataBaseClient = new StorageDatabaseChannelClient(this.mainProcessService.getChannel('storage'));

		const globalStorage = new Storage(storageDataBaseClient.globalStorage);

		this._register(globalStorage.onDidChangeStorage(key => this.emitDidChangeValue(StorageScope.GLOBAL, key)));

		return globalStorage;
	}

	protected async doInitialize(): Promise<void> {

		// Init all storage locations
		await Promises.settled([
			this.globalStorage.init(),
		]);

	}

	protected getStorage(scope: StorageScope): IStorage | undefined {
		return scope === StorageScope.GLOBAL ? this.globalStorage : undefined;
	}

	protected getLogDetails(scope: StorageScope): string | undefined {
		return scope === StorageScope.GLOBAL ? this.environmentService.globalStorageHome.fsPath : undefined;
	}

	async close(): Promise<void> {

		// Stop periodic scheduler and idle runner as we now collect state normally
		this.stopFlushWhenIdle();

		// Signal as event so that clients can still store data
		this.emitWillSaveState(WillSaveStateReason.SHUTDOWN);

		// Do it
		await Promises.settled([
			this.globalStorage.close()
		]);
	}
}
