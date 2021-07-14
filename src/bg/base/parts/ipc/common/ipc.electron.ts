/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IMessagePassingProtocol } from 'bg/base/parts/ipc/common/ipc';
import { Event } from 'bg/base/common/event';
import { VSBuffer } from 'bg/base/common/buffer';

export interface Sender {
	send(channel: string, msg: unknown): void;
}

/**
 * The Electron `Protocol` leverages Electron style IPC communication (`ipcRenderer`, `ipcMain`)
 * for the implementation of the `IMessagePassingProtocol`. That style of API requires a channel
 * name for sending data.
 */
export class Protocol implements IMessagePassingProtocol {

	constructor(private sender: Sender, readonly onMessage: Event<VSBuffer>) { }

	send(message: VSBuffer): void {
		try {
			this.sender.send('biggain:message', message.buffer);
		} catch (e) {
			// systems are going down
		}
	}

	disconnect(): void {
		this.sender.send('biggain:disconnect', null);
	}
}
