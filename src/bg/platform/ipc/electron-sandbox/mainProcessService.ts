/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IChannel, IServerChannel } from 'bg/base/parts/ipc/common/ipc';
import { Client as IPCElectronClient } from 'bg/base/parts/ipc/electron-sandbox/ipc.electron';
import { Disposable } from 'bg/base/common/lifecycle';
import { IMainProcessService } from 'bg/platform/ipc/electron-sandbox/services';

/**
 * An implementation of `IMainProcessService` that leverages Electron's IPC.
 */
export class ElectronIPCMainProcessService extends Disposable implements IMainProcessService {

	declare readonly _serviceBrand: undefined;

	private mainProcessConnection: IPCElectronClient;

	constructor(
		windowId: number
	) {
		super();

		this.mainProcessConnection = this._register(new IPCElectronClient(`window:${windowId}`));
	}

	getChannel(channelName: string): IChannel {
		return this.mainProcessConnection.getChannel(channelName);
	}

	registerChannel(channelName: string, channel: IServerChannel<string>): void {
		this.mainProcessConnection.registerChannel(channelName, channel);
	}
}
