/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { distinct, firstOrDefault } from 'bg/base/common/arrays';
import { IEnvironmentMainService } from 'bg/platform/environment/electron-main/environmentMainService';
import { BrowserWindow, WebContents } from 'electron';
import { ILogService } from 'bg/platform/log/common/log';
import { IOpenEmptyWindowOptions } from 'bg/platform/windows/common/windows';
import { Event, Emitter } from 'bg/base/common/event';
import { IWindowsMainService, IOpenConfiguration, IWindowsCountChangedEvent, ICodeWindow, IOpenEmptyConfiguration } from 'bg/platform/windows/electron-main/windows';
import { URI } from 'bg/base/common/uri';
import { Disposable, DisposableStore } from 'bg/base/common/lifecycle';
import { CancellationToken } from 'bg/base/common/cancellation';
import { IProtocolMainService } from 'bg/platform/protocol/electron-main/protocol';

export class WindowsMainService extends Disposable implements IWindowsMainService {

	declare readonly _serviceBrand: undefined;

	private static readonly WINDOWS: ICodeWindow[] = [];

	private readonly _onDidOpenWindow = this._register(new Emitter<ICodeWindow>());
	readonly onDidOpenWindow = this._onDidOpenWindow.event;

	private readonly _onDidSignalReadyWindow = this._register(new Emitter<ICodeWindow>());
	readonly onDidSignalReadyWindow = this._onDidSignalReadyWindow.event;

	private readonly _onDidDestroyWindow = this._register(new Emitter<ICodeWindow>());
	readonly onDidDestroyWindow = this._onDidDestroyWindow.event;

	private readonly _onDidChangeWindowsCount = this._register(new Emitter<IWindowsCountChangedEvent>());
	readonly onDidChangeWindowsCount = this._onDidChangeWindowsCount.event;

	constructor(
		@ILogService private readonly logService: ILogService,
		@IEnvironmentMainService private readonly environmentMainService: IEnvironmentMainService,
		@IProtocolMainService private readonly protocolMainService: IProtocolMainService
	) {
		super();

		this.registerListeners();
	}

	private registerListeners(): void {

		// Update valid roots in protocol service for extension dev windows
		this._register(this.onDidSignalReadyWindow(window => {
			if (window.config?.extensionDevelopmentPath || window.config?.extensionTestsPath) {
				const disposables = new DisposableStore();
				disposables.add(Event.any(window.onDidClose, window.onDidDestroy)(() => disposables.dispose()));

				// Allow access to extension development path
				if (window.config.extensionDevelopmentPath) {
					for (const extensionDevelopmentPath of window.config.extensionDevelopmentPath) {
						disposables.add(this.protocolMainService.addValidFileRoot(URI.file(extensionDevelopmentPath)));
					}
				}

				// Allow access to extension tests path
				if (window.config.extensionTestsPath) {
					disposables.add(this.protocolMainService.addValidFileRoot(URI.file(window.config.extensionTestsPath)));
				}
			}
		}));
	}

	openEmptyWindow(openConfig: IOpenEmptyConfiguration, options?: IOpenEmptyWindowOptions): ICodeWindow[] {
		let cli = this.environmentMainService.args;
		const remoteAuthority = options?.remoteAuthority || undefined;
		const forceEmpty = true;
		const forceReuseWindow = options?.forceReuseWindow;
		const forceNewWindow = !forceReuseWindow;

		return this.open({ ...openConfig, cli, forceEmpty, forceNewWindow, forceReuseWindow, remoteAuthority });
	}

	open(openConfig: IOpenConfiguration): ICodeWindow[] {
		this.logService.trace('windowsManager#open');

		if (openConfig.addMode && (openConfig.initialStartup || !this.getLastActiveWindow())) {
			openConfig.addMode = false; // Make sure addMode is only enabled if we have an active window
		}

		// Open based on config
		const { windows: usedWindows } = this.doOpen(openConfig);
		return usedWindows;
	}

	private doOpen(
		openConfig: IOpenConfiguration,
	): { windows: ICodeWindow[] } {

		// Keep track of used windows and remember
		// if files have been opened in one of them
		const usedWindows: ICodeWindow[] = [];
		return { windows: distinct(usedWindows) };
	}

	getFocusedWindow(): ICodeWindow | undefined {
		const window = BrowserWindow.getFocusedWindow();
		if (window) {
			return this.getWindowById(window.id);
		}

		return undefined;
	}

	getLastActiveWindow(): ICodeWindow | undefined {
		return this.doGetLastActiveWindow(this.getWindows());
	}

	private doGetLastActiveWindow(windows: ICodeWindow[]): ICodeWindow | undefined {
		const lastFocusedDate = Math.max.apply(Math, windows.map(window => window.lastFocusTime));

		return windows.find(window => window.lastFocusTime === lastFocusedDate);
	}

	sendToFocused(channel: string, ...args: any[]): void {
		const focusedWindow = this.getFocusedWindow() || this.getLastActiveWindow();

		if (focusedWindow) {
			focusedWindow.sendWhenReady(channel, CancellationToken.None, ...args);
		}
	}

	sendToAll(channel: string, payload?: any, windowIdsToIgnore?: number[]): void {
		for (const window of this.getWindows()) {
			if (windowIdsToIgnore && windowIdsToIgnore.indexOf(window.id) >= 0) {
				continue; // do not send if we are instructed to ignore it
			}

			window.sendWhenReady(channel, CancellationToken.None, payload);
		}
	}

	getWindows(): ICodeWindow[] {
		return WindowsMainService.WINDOWS;
	}

	getWindowCount(): number {
		return WindowsMainService.WINDOWS.length;
	}

	getWindowById(windowId: number): ICodeWindow | undefined {
		const windows = this.getWindows().filter(window => window.id === windowId);

		return firstOrDefault(windows);
	}

	getWindowByWebContents(webContents: WebContents): ICodeWindow | undefined {
		const browserWindow = BrowserWindow.fromWebContents(webContents);
		if (!browserWindow) {
			return undefined;
		}

		return this.getWindowById(browserWindow.id);
	}
}
