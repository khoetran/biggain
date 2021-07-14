/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'bg/base/common/event';
import { IDiskFileChange, ILogMessage } from 'bg/platform/files/node/watcher/watcher';

export interface IWatcherRequest {
	path: string;
	excludes: string[];
}

export interface IWatcherService {

	readonly onDidChangeFile: Event<IDiskFileChange[]>;
	readonly onDidLogMessage: Event<ILogMessage>;

	setRoots(roots: IWatcherRequest[]): Promise<void>;
	setVerboseLogging(enabled: boolean): Promise<void>;

	stop(): Promise<void>;
}
