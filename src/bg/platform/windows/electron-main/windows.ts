/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IWindowOpenable, IOpenEmptyWindowOptions, INativeWindowConfiguration } from 'bg/platform/windows/common/windows';
import { NativeParsedArgs } from 'bg/platform/environment/common/argv';
import { Event } from 'bg/base/common/event';
import { createDecorator } from 'bg/platform/instantiation/common/instantiation';
import { IProcessEnvironment } from 'bg/base/common/platform';
import { ISerializableCommandAction } from 'bg/platform/actions/common/actions';
import { URI } from 'bg/base/common/uri';
import { Rectangle, BrowserWindow, WebContents } from 'electron';
import { IDisposable } from 'bg/base/common/lifecycle';
import { CancellationToken } from 'bg/base/common/cancellation';

export const enum LoadReason {

	/**
	 * The window is loaded for the first time.
	 */
	INITIAL = 1,

	/**
	 * The window is loaded into a different workspace context.
	 */
	LOAD,

	/**
	 * The window is reloaded.
	 */
	RELOAD
}

export const enum UnloadReason {

	/**
	 * The window is closed.
	 */
	CLOSE = 1,

	/**
	 * All windows unload because the application quits.
	 */
	QUIT,

	/**
	 * The window is reloaded.
	 */
	RELOAD,

	/**
	 * The window is loaded into a different workspace context.
	 */
	LOAD
}

export const enum OpenContext {

	// opening when running from the command line
	CLI,

	// macOS only: opening from the dock (also when opening files to a running instance from desktop)
	DOCK,

	// opening from the main application window
	MENU,

	// opening from a file or folder dialog
	DIALOG,

	// opening from the OS's UI
	DESKTOP,

	// opening through the API
	API
}

export interface IWindowState {
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	mode?: WindowMode;
	display?: number;
}

export const defaultWindowState = function (mode = WindowMode.Normal): IWindowState {
	return {
		width: 1024,
		height: 768,
		mode
	};
};

export const enum WindowMode {
	Maximized,
	Normal,
	Minimized, // not used anymore, but also cannot remove due to existing stored UI state (needs migration)
	Fullscreen
}

export interface ILoadEvent {
	reason: LoadReason;
}

export interface ICodeWindow extends IDisposable {

	readonly onWillLoad: Event<ILoadEvent>;
	readonly onDidSignalReady: Event<void>;
	readonly onDidClose: Event<void>;
	readonly onDidDestroy: Event<void>;

	readonly whenClosedOrLoaded: Promise<void>;

	readonly id: number;
	readonly win: BrowserWindow | null; /* `null` after being disposed */
	readonly config: INativeWindowConfiguration | undefined;

	readonly backupPath?: string;

	readonly remoteAuthority?: string;

	readonly isExtensionDevelopmentHost: boolean;
	readonly isExtensionTestHost: boolean;

	readonly lastFocusTime: number;

	readonly isReady: boolean;
	ready(): Promise<ICodeWindow>;
	setReady(): void;

	readonly hasHiddenTitleBarStyle: boolean;

	addTabbedWindow(window: ICodeWindow): void;

	load(config: INativeWindowConfiguration, options?: { isReload?: boolean }): void;
	reload(cli?: NativeParsedArgs): void;

	focus(options?: { force: boolean }): void;
	close(): void;

	getBounds(): Rectangle;

	send(channel: string, ...args: any[]): void;
	sendWhenReady(channel: string, token: CancellationToken, ...args: any[]): void;

	readonly isFullScreen: boolean;
	toggleFullScreen(): void;

	isMinimized(): boolean;

	setRepresentedFilename(name: string): void;
	getRepresentedFilename(): string | undefined;

	setDocumentEdited(edited: boolean): void;
	isDocumentEdited(): boolean;

	handleTitleDoubleClick(): void;

	updateTouchBar(items: ISerializableCommandAction[][]): void;

	serializeWindowState(): IWindowState;
}

export const enum WindowError {

	/**
	 * Maps to the `unresponsive` event on a `BrowserWindow`.
	 */
	UNRESPONSIVE = 1,

	/**
	 * Maps to the `render-proces-gone` event on a `WebContents`.
	 */
	CRASHED = 2,

	/**
	 * Maps to the `did-fail-load` event on a `WebContents`.
	 */
	LOAD = 3
}

export const IWindowsMainService = createDecorator<IWindowsMainService>('windowsMainService');

export interface IWindowsCountChangedEvent {
	readonly oldCount: number;
	readonly newCount: number;
}

export interface IWindowsMainService {

	readonly _serviceBrand: undefined;

	readonly onDidChangeWindowsCount: Event<IWindowsCountChangedEvent>;

	readonly onDidOpenWindow: Event<ICodeWindow>;
	readonly onDidSignalReadyWindow: Event<ICodeWindow>;
	readonly onDidDestroyWindow: Event<ICodeWindow>;

	open(openConfig: IOpenConfiguration): ICodeWindow[];
	openEmptyWindow(openConfig: IOpenEmptyConfiguration, options?: IOpenEmptyWindowOptions): ICodeWindow[];

	sendToFocused(channel: string, ...args: any[]): void;
	sendToAll(channel: string, payload?: any, windowIdsToIgnore?: number[]): void;

	getWindows(): ICodeWindow[];
	getWindowCount(): number;

	getFocusedWindow(): ICodeWindow | undefined;
	getLastActiveWindow(): ICodeWindow | undefined;

	getWindowById(windowId: number): ICodeWindow | undefined;
	getWindowByWebContents(webContents: WebContents): ICodeWindow | undefined;
}

export interface IBaseOpenConfiguration {
	readonly context: OpenContext;
	readonly contextWindowId?: number;
}

export interface IOpenConfiguration extends IBaseOpenConfiguration {
	readonly cli: NativeParsedArgs;
	readonly userEnv?: IProcessEnvironment;
	readonly urisToOpen?: IWindowOpenable[];
	readonly waitMarkerFileURI?: URI;
	readonly preferNewWindow?: boolean;
	readonly forceNewWindow?: boolean;
	readonly forceNewTabbedWindow?: boolean;
	readonly forceReuseWindow?: boolean;
	readonly forceEmpty?: boolean;
	readonly diffMode?: boolean;
	addMode?: boolean;
	readonly gotoLineMode?: boolean;
	readonly initialStartup?: boolean;
	readonly noRecentEntry?: boolean;
	/**
	 * The remote authority to use when windows are opened with either
	 * - no workspace (empty window)
	 * - a workspace that is neither `file://` nor `biggain-remote://`
	 */
	readonly remoteAuthority?: string;
}

export interface IOpenEmptyConfiguration extends IBaseOpenConfiguration { }
