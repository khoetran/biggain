/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { ILogService, ILoggerService, ILogger, ILoggerOptions, AbstractLoggerService, LogLevel } from 'bg/platform/log/common/log';
import { URI } from 'bg/base/common/uri';
import { basename } from 'bg/base/common/resources';
import { Schemas } from 'bg/base/common/network';
import { FileLogger } from 'bg/platform/log/common/fileLog';
import { SpdLogLogger } from 'bg/platform/log/node/spdlogLog';
import { IFileService } from 'bg/platform/files/common/files';
import { generateUuid } from 'bg/base/common/uuid';

export class LoggerService extends AbstractLoggerService implements ILoggerService {

	constructor(
		@ILogService logService: ILogService,
		@IFileService private readonly fileService: IFileService
	) {
		super(logService.getLevel(), logService.onDidChangeLogLevel);
	}

	protected doCreateLogger(resource: URI, logLevel: LogLevel, options?: ILoggerOptions): ILogger {
		if (resource.scheme === Schemas.file) {
			const logger = new SpdLogLogger(options?.name || generateUuid(), resource.fsPath, !options?.donotRotate, logLevel);
			if (options?.donotUseFormatters) {
				(<SpdLogLogger>logger).clearFormatters();
			}
			return logger;
		} else {
			return new FileLogger(options?.name ?? basename(resource), resource, logLevel, this.fileService);
		}
	}
}

