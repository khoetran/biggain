/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Server } from 'bg/base/parts/ipc/node/ipc.cp';
import { NsfwWatcherService } from 'bg/platform/files/node/watcher/nsfw/nsfwWatcherService';
import { ProxyChannel } from 'bg/base/parts/ipc/common/ipc';

const server = new Server('watcher');
const service = new NsfwWatcherService();
server.registerChannel('watcher', ProxyChannel.fromService(service));
