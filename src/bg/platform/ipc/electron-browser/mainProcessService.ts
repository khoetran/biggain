/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IChannel, IServerChannel, StaticRouter } from 'bg/base/parts/ipc/common/ipc';
import { Server as MessagePortServer } from 'bg/base/parts/ipc/electron-browser/ipc.mp';
import { IMainProcessService } from 'bg/platform/ipc/electron-sandbox/services';

/**
 * An implementation of `IMainProcessService` that leverages MessagePorts.
 */
export class MessagePortMainProcessService implements IMainProcessService {

	declare readonly _serviceBrand: undefined;

	constructor(
		private server: MessagePortServer,
		private router: StaticRouter
	) { }

	getChannel(channelName: string): IChannel {
		return this.server.getChannel(channelName, this.router);
	}

	registerChannel(channelName: string, channel: IServerChannel<string>): void {
		this.server.registerChannel(channelName, channel);
	}
}
