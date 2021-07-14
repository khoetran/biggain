/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from 'bg/base/common/event';
import { Disposable } from 'bg/base/common/lifecycle';
import { IServerChannel } from 'bg/base/parts/ipc/common/ipc';
import { ILogService } from 'bg/platform/log/common/log';
import { ISerializableItemsChangeEvent, ISerializableUpdateRequest, IBaseSerializableStorageRequest, Key, Value } from 'bg/platform/storage/common/storageIpc';
import { IStorageChangeEvent, IStorageMain } from 'bg/platform/storage/electron-main/storageMain';
import { IStorageMainService } from 'bg/platform/storage/electron-main/storageMainService';

export class StorageDatabaseChannel extends Disposable implements IServerChannel {

	private static readonly STORAGE_CHANGE_DEBOUNCE_TIME = 100;

	private readonly _onDidChangeGlobalStorage = this._register(new Emitter<ISerializableItemsChangeEvent>());
	private readonly onDidChangeGlobalStorage = this._onDidChangeGlobalStorage.event;

	constructor(
		private logService: ILogService,
		private storageMainService: IStorageMainService
	) {
		super();

		this.registerGlobalStorageListeners();
	}

	//#region Global Storage Change Events

	private registerGlobalStorageListeners(): void {

		// Listen for changes in global storage to send to listeners
		// that are listening. Use a debouncer to reduce IPC traffic.
		this._register(Event.debounce(this.storageMainService.globalStorage.onDidChangeStorage, (prev: IStorageChangeEvent[] | undefined, cur: IStorageChangeEvent) => {
			if (!prev) {
				prev = [cur];
			} else {
				prev.push(cur);
			}

			return prev;
		}, StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
			if (events.length) {
				this._onDidChangeGlobalStorage.fire(this.serializeGlobalStorageEvents(events));
			}
		}));
	}

	private serializeGlobalStorageEvents(events: IStorageChangeEvent[]): ISerializableItemsChangeEvent {
		const changed = new Map<Key, Value>();
		const deleted = new Set<Key>();
		events.forEach(event => {
			const existing = this.storageMainService.globalStorage.get(event.key);
			if (typeof existing === 'string') {
				changed.set(event.key, existing);
			} else {
				deleted.add(event.key);
			}
		});

		return {
			changed: Array.from(changed.entries()),
			deleted: Array.from(deleted.values())
		};
	}

	listen(_: unknown, event: string): Event<any> {
		switch (event) {
			case 'onDidChangeGlobalStorage': return this.onDidChangeGlobalStorage;
		}

		throw new Error(`Event not found: ${event}`);
	}

	//#endregion

	async call(_: unknown, command: string, arg: IBaseSerializableStorageRequest): Promise<any> {

		// Get storage to be ready
		const storage = await this.withStorageInitialized();

		// handle call
		switch (command) {
			case 'getItems': {
				return Array.from(storage.items.entries());
			}

			case 'updateItems': {
				const items: ISerializableUpdateRequest = arg;

				if (items.insert) {
					for (const [key, value] of items.insert) {
						storage.set(key, value);
					}
				}

				if (items.delete) {
					items.delete.forEach(key => storage.delete(key));
				}

				break;
			}

			case 'close': {
				break;
			}

			default:
				throw new Error(`Call not found: ${command}`);
		}
	}

	private async withStorageInitialized(): Promise<IStorageMain> {
		const storage = this.storageMainService.globalStorage;

		try {
			await storage.init();
		} catch (error) {
			this.logService.error(`StorageIPC#init: Unable to init global storage due to ${error}`);
		}

		return storage;
	}
}
