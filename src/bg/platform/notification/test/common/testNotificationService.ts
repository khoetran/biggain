/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { INotificationService, INotificationHandle, NoOpNotification, Severity, INotification, IPromptChoice, IPromptOptions, IStatusMessageOptions, NotificationsFilter } from 'bg/platform/notification/common/notification';
import { Disposable, IDisposable } from 'bg/base/common/lifecycle';
import { Event } from 'bg/base/common/event';

export class TestNotificationService implements INotificationService {

	readonly onDidAddNotification: Event<INotification> = Event.None;

	readonly onDidRemoveNotification: Event<INotification> = Event.None;

	declare readonly _serviceBrand: undefined;

	private static readonly NO_OP: INotificationHandle = new NoOpNotification();

	info(message: string): INotificationHandle {
		return this.notify({ severity: Severity.Info, message });
	}

	warn(message: string): INotificationHandle {
		return this.notify({ severity: Severity.Warning, message });
	}

	error(error: string | Error): INotificationHandle {
		return this.notify({ severity: Severity.Error, message: error });
	}

	notify(notification: INotification): INotificationHandle {
		return TestNotificationService.NO_OP;
	}

	prompt(severity: Severity, message: string, choices: IPromptChoice[], options?: IPromptOptions): INotificationHandle {
		return TestNotificationService.NO_OP;
	}

	status(message: string | Error, options?: IStatusMessageOptions): IDisposable {
		return Disposable.None;
	}

	setFilter(filter: NotificationsFilter): void { }
}
