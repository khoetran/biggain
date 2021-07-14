/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { strictEqual } from 'assert';
import { OPTIONS, parseArgs } from 'bg/platform/environment/node/argv';
import { NativeEnvironmentService } from 'bg/platform/environment/node/environmentService';
import { NullLogService } from 'bg/platform/log/common/log';
import { StorageMainService } from 'bg/platform/storage/electron-main/storageMainService';
import { IStorageChangeEvent, IStorageMain, IStorageMainOptions } from 'bg/platform/storage/electron-main/storageMain';
import { IS_NEW_KEY } from 'bg/platform/storage/common/storage';
import { ILifecycleMainService, LifecycleMainPhase, ShutdownEvent } from 'bg/platform/lifecycle/electron-main/lifecycleMainService';
import { Emitter, Event } from 'bg/base/common/event';
import { NativeParsedArgs } from 'bg/platform/environment/common/argv';
import { ICodeWindow, UnloadReason } from 'bg/platform/windows/electron-main/windows';
import { Promises } from 'bg/base/common/async';
import product from 'bg/platform/product/common/product';
import { IProductService } from 'bg/platform/product/common/productService';

suite('StorageMainService', function () {

	const productService: IProductService = { _serviceBrand: undefined, ...product };

	class TestStorageMainService extends StorageMainService {

		protected override getStorageOptions(): IStorageMainOptions {
			return {
				useInMemoryStorage: true
			};
		}
	}

	class StorageTestLifecycleMainService implements ILifecycleMainService {

		_serviceBrand: undefined;

		onBeforeShutdown = Event.None;

		private readonly _onWillShutdown = new Emitter<ShutdownEvent>();
		readonly onWillShutdown = this._onWillShutdown.event;

		async fireOnWillShutdown(): Promise<void> {
			const joiners: Promise<void>[] = [];

			this._onWillShutdown.fire({
				join(promise) {
					joiners.push(promise);
				}
			});

			await Promises.settled(joiners);
		}

		onWillLoadWindow = Event.None;
		onBeforeCloseWindow = Event.None;
		onBeforeUnloadWindow = Event.None;

		wasRestarted = false;
		quitRequested = false;

		phase = LifecycleMainPhase.Ready;

		registerWindow(window: ICodeWindow): void { }
		async reload(window: ICodeWindow, cli?: NativeParsedArgs): Promise<void> { }
		async unload(window: ICodeWindow, reason: UnloadReason): Promise<boolean> { return true; }
		async relaunch(options?: { addArgs?: string[] | undefined; removeArgs?: string[] | undefined; }): Promise<void> { }
		async quit(willRestart?: boolean): Promise<boolean> { return true; }
		async kill(code?: number): Promise<void> { }
		async when(phase: LifecycleMainPhase): Promise<void> { }
	}

	async function testStorage(storage: IStorageMain, isGlobal: boolean): Promise<void> {

		// Telemetry: added after init
		if (isGlobal) {
			strictEqual(storage.items.size, 0);
			await storage.init();
		} else {
			await storage.init();
		}

		let storageChangeEvent: IStorageChangeEvent | undefined = undefined;
		const storageChangeListener = storage.onDidChangeStorage(e => {
			storageChangeEvent = e;
		});

		let storageDidClose = false;
		const storageCloseListener = storage.onDidCloseStorage(() => storageDidClose = true);

		// Basic store/get/remove
		const size = storage.items.size;

		storage.set('bar', 'foo');
		strictEqual(storageChangeEvent!.key, 'bar');
		storage.set('barNumber', 55);
		storage.set('barBoolean', true);

		strictEqual(storage.get('bar'), 'foo');
		strictEqual(storage.get('barNumber'), '55');
		strictEqual(storage.get('barBoolean'), 'true');

		strictEqual(storage.items.size, size + 3);

		storage.delete('bar');
		strictEqual(storage.get('bar'), undefined);

		strictEqual(storage.items.size, size + 2);

		// IS_NEW
		strictEqual(storage.get(IS_NEW_KEY), 'true');

		// Close
		await storage.close();

		strictEqual(storageDidClose, true);

		storageChangeListener.dispose();
		storageCloseListener.dispose();
	}

	test('basics (global)', function () {
		const storageMainService = new TestStorageMainService(new NullLogService(), new NativeEnvironmentService(parseArgs(process.argv, OPTIONS), productService), new StorageTestLifecycleMainService());

		return testStorage(storageMainService.globalStorage, true);
	});

	test('storage closed onWillShutdown', async function () {
		const lifecycleMainService = new StorageTestLifecycleMainService();
		const storageMainService = new TestStorageMainService(new NullLogService(), new NativeEnvironmentService(parseArgs(process.argv, OPTIONS), productService), lifecycleMainService);

		let globalStorage = storageMainService.globalStorage;
		let didCloseGlobalStorage = false;
		globalStorage.onDidCloseStorage(() => {
			didCloseGlobalStorage = true;
		});
		await globalStorage.init();

		await lifecycleMainService.fireOnWillShutdown();

		strictEqual(didCloseGlobalStorage, true);

	});

	test('storage closed before init works', async function () {
		const storageMainService = new TestStorageMainService(new NullLogService(), new NativeEnvironmentService(parseArgs(process.argv, OPTIONS), productService), new StorageTestLifecycleMainService());

		let globalStorage = storageMainService.globalStorage;
		let didCloseGlobalStorage = false;
		globalStorage.onDidCloseStorage(() => {
			didCloseGlobalStorage = true;
		});

		await globalStorage.close();

		strictEqual(didCloseGlobalStorage, true);
	});

	test('storage closed before init awaits works', async function () {
		const storageMainService = new TestStorageMainService(new NullLogService(), new NativeEnvironmentService(parseArgs(process.argv, OPTIONS), productService), new StorageTestLifecycleMainService());

		let globalStorage = storageMainService.globalStorage;
		let didCloseGlobalStorage = false;
		globalStorage.onDidCloseStorage(() => {
			didCloseGlobalStorage = true;
		});

		globalStorage.init();

		await globalStorage.close();

		strictEqual(didCloseGlobalStorage, true);
	});
});
