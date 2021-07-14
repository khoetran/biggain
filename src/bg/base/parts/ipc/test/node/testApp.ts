/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Server } from 'bg/base/parts/ipc/node/ipc.cp';
import { TestChannel, TestService } from './testService';

const server = new Server('test');
const service = new TestService();
server.registerChannel('test', new TestChannel(service));
