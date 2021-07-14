/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { ContextMenuHandler, IContextMenuHandlerOptions } from './contextMenuHandler';
import { IContextViewService, IContextMenuService } from './contextView';
import { INotificationService } from 'bg/platform/notification/common/notification';
import { IContextMenuDelegate } from 'bg/base/browser/contextmenu';
import { IThemeService } from 'bg/platform/theme/common/themeService';
import { IKeybindingService } from 'bg/platform/keybinding/common/keybinding';
import { Disposable } from 'bg/base/common/lifecycle';
import { ModifierKeyEmitter } from 'bg/base/browser/dom';
import { Emitter } from 'bg/base/common/event';

export class ContextMenuService extends Disposable implements IContextMenuService {
	declare readonly _serviceBrand: undefined;

	private contextMenuHandler: ContextMenuHandler;

	readonly onDidShowContextMenu = new Emitter<void>().event;

	constructor(
		@INotificationService notificationService: INotificationService,
		@IContextViewService contextViewService: IContextViewService,
		@IKeybindingService keybindingService: IKeybindingService,
		@IThemeService themeService: IThemeService
	) {
		super();

		this.contextMenuHandler = new ContextMenuHandler(contextViewService, notificationService, keybindingService, themeService);
	}

	configure(options: IContextMenuHandlerOptions): void {
		this.contextMenuHandler.configure(options);
	}

	// ContextMenu

	showContextMenu(delegate: IContextMenuDelegate): void {
		this.contextMenuHandler.showContextMenu(delegate);
		ModifierKeyEmitter.getInstance().resetKeyStatus();
	}
}
