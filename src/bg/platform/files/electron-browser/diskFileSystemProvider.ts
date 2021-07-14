/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { DiskFileSystemProvider as NodeDiskFileSystemProvider, IDiskFileSystemProviderOptions } from 'bg/platform/files/node/diskFileSystemProvider';
import { FileSystemProviderCapabilities } from 'bg/platform/files/common/files';
import { ILogService } from 'bg/platform/log/common/log';

export class DiskFileSystemProvider extends NodeDiskFileSystemProvider {

	constructor(
		logService: ILogService,
		options?: IDiskFileSystemProviderOptions
	) {
		super(logService, options);
	}

	override get capabilities(): FileSystemProviderCapabilities {
		if (!this._capabilities) {
			this._capabilities = super.capabilities | FileSystemProviderCapabilities.Trash;
		}

		return this._capabilities;
	}
}
