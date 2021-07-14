/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'bg/base/common/event';
import { IPCClient } from 'bg/base/parts/ipc/common/ipc';
import { Protocol as ElectronProtocol } from 'bg/base/parts/ipc/common/ipc.electron';
import { IDisposable } from 'bg/base/common/lifecycle';
import { VSBuffer } from 'bg/base/common/buffer';
import { ipcRenderer } from 'bg/base/parts/sandbox/electron-sandbox/globals';

/**
 * An implemention of `IPCClient` on top of Electron `ipcRenderer` IPC communication
 * provided from sandbox globals (via preload script).
 */
export class Client extends IPCClient implements IDisposable {

	private protocol: ElectronProtocol;

	private static createProtocol(): ElectronProtocol {
		const onMessage = Event.fromNodeEventEmitter<VSBuffer>(ipcRenderer, 'biggain:message', (_, message) => VSBuffer.wrap(message));
		ipcRenderer.send('biggain:hello');

		return new ElectronProtocol(ipcRenderer, onMessage);
	}

	constructor(id: string) {
		const protocol = Client.createProtocol();
		super(protocol, id);

		this.protocol = protocol;
	}

	override dispose(): void {
		this.protocol.disconnect();
	}
}
