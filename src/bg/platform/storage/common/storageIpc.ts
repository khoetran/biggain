/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Emitter, Event } from 'bg/base/common/event';
import { Disposable } from 'bg/base/common/lifecycle';
import { IChannel } from 'bg/base/parts/ipc/common/ipc';
import { IStorageDatabase, IStorageItemsChangeEvent, IUpdateRequest } from 'bg/base/parts/storage/common/storage';

export type Key = string;
export type Value = string;
export type Item = [Key, Value];

export interface IBaseSerializableStorageRequest {
}

export interface ISerializableUpdateRequest extends IBaseSerializableStorageRequest {
	insert?: Item[];
	delete?: Key[];
}

export interface ISerializableItemsChangeEvent {
	readonly changed?: Item[];
	readonly deleted?: Key[];
}

abstract class BaseStorageDatabaseClient extends Disposable implements IStorageDatabase {

	abstract readonly onDidChangeItemsExternal: Event<IStorageItemsChangeEvent>;

	constructor(protected channel: IChannel) {
		super();
	}

	async getItems(): Promise<Map<string, string>> {
		const serializableRequest: IBaseSerializableStorageRequest = {};
		const items: Item[] = await this.channel.call('getItems', serializableRequest);

		return new Map(items);
	}

	updateItems(request: IUpdateRequest): Promise<void> {
		const serializableRequest: ISerializableUpdateRequest = {};

		if (request.insert) {
			serializableRequest.insert = Array.from(request.insert.entries());
		}

		if (request.delete) {
			serializableRequest.delete = Array.from(request.delete.values());
		}

		return this.channel.call('updateItems', serializableRequest);
	}

	abstract close(): Promise<void>;
}

class GlobalStorageDatabaseClient extends BaseStorageDatabaseClient implements IStorageDatabase {

	private readonly _onDidChangeItemsExternal = this._register(new Emitter<IStorageItemsChangeEvent>());
	readonly onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;

	constructor(channel: IChannel) {
		super(channel);

		this.registerListeners();
	}

	private registerListeners(): void {
		this._register(this.channel.listen<ISerializableItemsChangeEvent>('onDidChangeGlobalStorage')((e: ISerializableItemsChangeEvent) => this.onDidChangeGlobalStorage(e)));
	}

	private onDidChangeGlobalStorage(e: ISerializableItemsChangeEvent): void {
		if (Array.isArray(e.changed) || Array.isArray(e.deleted)) {
			this._onDidChangeItemsExternal.fire({
				changed: e.changed ? new Map(e.changed) : undefined,
				deleted: e.deleted ? new Set<string>(e.deleted) : undefined
			});
		}
	}

	async close(): Promise<void> {

		// The global storage database is shared across all instances so
		// we do not await it. However we dispose the listener for external
		// changes because we no longer interested int it.
		this.dispose();
	}
}

export class StorageDatabaseChannelClient extends Disposable {

	private _globalStorage: GlobalStorageDatabaseClient | undefined = undefined;
	get globalStorage() {
		if (!this._globalStorage) {
			this._globalStorage = new GlobalStorageDatabaseClient(this.channel);
		}

		return this._globalStorage;
	}

	constructor(
		private channel: IChannel
	) {
		super();
	}
}
