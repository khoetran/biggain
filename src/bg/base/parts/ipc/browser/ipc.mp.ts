/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from 'bg/base/common/lifecycle';
import { Client as MessagePortClient } from 'bg/base/parts/ipc/common/ipc.mp';

/**
 * An implementation of a `IPCClient` on top of DOM `MessagePort`.
 */
export class Client extends MessagePortClient implements IDisposable {

	/**
	 * @param clientId a way to uniquely identify this client among
	 * other clients. this is important for routing because every
	 * client can also be a server
	 */
	constructor(port: MessagePort, clientId: string) {
		super(port, clientId);
	}
}
