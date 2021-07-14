/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Event, Emitter } from 'bg/base/common/event';
import { Disposable, IDisposable } from 'bg/base/common/lifecycle';
import { ILogService, LogLevel } from 'bg/platform/log/common/log';
import { IEnvironmentService } from 'bg/platform/environment/common/environment';
import { SQLiteStorageDatabase, ISQLiteStorageDatabaseLoggingOptions } from 'bg/base/parts/storage/node/storage';
import { Storage, InMemoryStorageDatabase, IStorage } from 'bg/base/parts/storage/common/storage';
import { join } from 'bg/base/common/path';
import { IS_NEW_KEY } from 'bg/platform/storage/common/storage';

export interface IStorageMainOptions {

	/**
	 * If enabled, storage will not persist to disk
	 * but into memory.
	 */
	useInMemoryStorage?: boolean;
}

/**
 * Provides access to global and workspace storage from the
 * electron-main side that is the owner of all storage connections.
 */
export interface IStorageMain extends IDisposable {

	/**
	 * Emitted whenever data is updated or deleted.
	 */
	readonly onDidChangeStorage: Event<IStorageChangeEvent>;

	/**
	 * Emitted when the storage is closed.
	 */
	readonly onDidCloseStorage: Event<void>;

	/**
	 * Access to all cached items of this storage service.
	 */
	readonly items: Map<string, string>;

	/**
	 * Required call to ensure the service can be used.
	 */
	init(): Promise<void>;

	/**
	 * Retrieve an element stored with the given key from storage. Use
	 * the provided defaultValue if the element is null or undefined.
	 */
	get(key: string, fallbackValue: string): string;
	get(key: string, fallbackValue?: string): string | undefined;

	/**
	 * Store a string value under the given key to storage. The value will
	 * be converted to a string.
	 */
	set(key: string, value: string | boolean | number | undefined | null): void;

	/**
	 * Delete an element stored under the provided key from storage.
	 */
	delete(key: string): void;

	/**
	 * Close the storage connection.
	 */
	close(): Promise<void>;
}

export interface IStorageChangeEvent {
	key: string;
}

abstract class BaseStorageMain extends Disposable implements IStorageMain {

	protected readonly _onDidChangeStorage = this._register(new Emitter<IStorageChangeEvent>());
	readonly onDidChangeStorage = this._onDidChangeStorage.event;

	private readonly _onDidCloseStorage = this._register(new Emitter<void>());
	readonly onDidCloseStorage = this._onDidCloseStorage.event;

	private storage: IStorage = new Storage(new InMemoryStorageDatabase()); // storage is in-memory until initialized

	private initializePromise: Promise<void> | undefined = undefined;

	constructor(
		protected readonly logService: ILogService
	) {
		super();
	}

	init(): Promise<void> {
		if (!this.initializePromise) {
			this.initializePromise = (async () => {
				try {

					// Create storage via subclasses
					const storage = await this.doCreate();

					// Replace our in-memory storage with the real
					// once as soon as possible without awaiting
					// the init call.
					this.storage.dispose();
					this.storage = storage;

					// Re-emit storage changes via event
					this._register(storage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key })));

					// Await storage init
					await this.doInit(storage);

					// Ensure we track wether storage is new or not
					const isNewStorage = storage.getBoolean(IS_NEW_KEY);
					if (isNewStorage === undefined) {
						storage.set(IS_NEW_KEY, true);
					} else if (isNewStorage) {
						storage.set(IS_NEW_KEY, false);
					}
				} catch (error) {
					this.logService.error(`StorageMain#initialize(): Unable to init storage due to ${error}`);
				}
			})();
		}

		return this.initializePromise;
	}

	protected createLogginOptions(): ISQLiteStorageDatabaseLoggingOptions {
		return {
			logTrace: (this.logService.getLevel() === LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
			logError: error => this.logService.error(error)
		};
	}

	protected doInit(storage: IStorage): Promise<void> {
		return storage.init();
	}

	protected abstract doCreate(): Promise<IStorage>;

	get items(): Map<string, string> { return this.storage.items; }

	get(key: string, fallbackValue: string): string;
	get(key: string, fallbackValue?: string): string | undefined;
	get(key: string, fallbackValue?: string): string | undefined {
		return this.storage.get(key, fallbackValue);
	}

	set(key: string, value: string | boolean | number | undefined | null): Promise<void> {
		return this.storage.set(key, value);
	}

	delete(key: string): Promise<void> {
		return this.storage.delete(key);
	}

	async close(): Promise<void> {

		// Ensure we are not accidentally leaving
		// a pending initialized storage behind in
		// case close() was called before init()
		// finishes
		if (this.initializePromise) {
			await this.initializePromise;
		}

		// Propagate to storage lib
		await this.storage.close();

		// Signal as event
		this._onDidCloseStorage.fire();
	}
}

export class GlobalStorageMain extends BaseStorageMain implements IStorageMain {

	private static readonly STORAGE_NAME = 'state.vscdb';

	constructor(
		private readonly options: IStorageMainOptions,
		logService: ILogService,
		private readonly environmentService: IEnvironmentService
	) {
		super(logService);
	}

	protected async doCreate(): Promise<IStorage> {
		let storagePath: string;
		if (this.options.useInMemoryStorage) {
			storagePath = SQLiteStorageDatabase.IN_MEMORY_PATH;
		} else {
			storagePath = join(this.environmentService.globalStorageHome.fsPath, GlobalStorageMain.STORAGE_NAME);
		}

		return new Storage(new SQLiteStorageDatabase(storagePath, {
			logging: this.createLogginOptions()
		}));
	}
}
