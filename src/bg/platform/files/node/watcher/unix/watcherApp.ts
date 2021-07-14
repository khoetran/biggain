/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Server } from 'bg/base/parts/ipc/node/ipc.cp';
import { ChokidarWatcherService } from 'bg/platform/files/node/watcher/unix/chokidarWatcherService';
import { ProxyChannel } from 'bg/base/parts/ipc/common/ipc';

const server = new Server('watcher');
const service = new ChokidarWatcherService();
server.registerChannel('watcher', ProxyChannel.fromService(service));
