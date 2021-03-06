/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'bg/css!./contextMenuHandler';

import { ActionRunner, IRunEvent } from 'bg/base/common/actions';
import { combinedDisposable, DisposableStore } from 'bg/base/common/lifecycle';
import { Menu } from 'bg/base/browser/ui/menu/menu';
import { IContextViewService } from 'bg/platform/contextview/browser/contextView';
import { INotificationService } from 'bg/platform/notification/common/notification';
import { IKeybindingService } from 'bg/platform/keybinding/common/keybinding';
import { IThemeService } from 'bg/platform/theme/common/themeService';
import { IContextMenuDelegate } from 'bg/base/browser/contextmenu';
import { EventType, $, isHTMLElement, addDisposableListener } from 'bg/base/browser/dom';
import { attachMenuStyler } from 'bg/platform/theme/common/styler';
import { StandardMouseEvent } from 'bg/base/browser/mouseEvent';
import { isPromiseCanceledError } from 'bg/base/common/errors';

export interface IContextMenuHandlerOptions {
	blockMouse: boolean;
}

export class ContextMenuHandler {
	private focusToReturn: HTMLElement | null = null;
	private block: HTMLElement | null = null;
	private options: IContextMenuHandlerOptions = { blockMouse: true };

	constructor(
		private contextViewService: IContextViewService,
		private notificationService: INotificationService,
		private keybindingService: IKeybindingService,
		private themeService: IThemeService
	) { }

	configure(options: IContextMenuHandlerOptions): void {
		this.options = options;
	}

	showContextMenu(delegate: IContextMenuDelegate): void {
		const actions = delegate.getActions();
		if (!actions.length) {
			return; // Don't render an empty context menu
		}

		this.focusToReturn = document.activeElement as HTMLElement;

		let menu: Menu | undefined;

		let shadowRootElement = isHTMLElement(delegate.domForShadowRoot) ? delegate.domForShadowRoot : undefined;
		this.contextViewService.showContextView({
			getAnchor: () => delegate.getAnchor(),
			canRelayout: false,
			anchorAlignment: delegate.anchorAlignment,
			anchorAxisAlignment: delegate.anchorAxisAlignment,

			render: (container) => {
				let className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';

				if (className) {
					container.className += ' ' + className;
				}

				// Render invisible div to block mouse interaction in the rest of the UI
				if (this.options.blockMouse) {
					this.block = container.appendChild($('.context-view-block'));
					this.block.style.position = 'fixed';
					this.block.style.cursor = 'initial';
					this.block.style.left = '0';
					this.block.style.top = '0';
					this.block.style.width = '100%';
					this.block.style.height = '100%';
					this.block.style.zIndex = '-1';

					// TODO@Steven: this is never getting disposed
					addDisposableListener(this.block, EventType.MOUSE_DOWN, e => e.stopPropagation());
				}

				const menuDisposables = new DisposableStore();

				const actionRunner = delegate.actionRunner || new ActionRunner();
				actionRunner.onBeforeRun(this.onActionRun, this, menuDisposables);
				actionRunner.onDidRun(this.onDidActionRun, this, menuDisposables);
				menu = new Menu(container, actions, {
					actionViewItemProvider: delegate.getActionViewItem,
					context: delegate.getActionsContext ? delegate.getActionsContext() : null,
					actionRunner,
					getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : action => this.keybindingService.lookupKeybinding(action.id)
				});

				menuDisposables.add(attachMenuStyler(menu, this.themeService));

				menu.onDidCancel(() => this.contextViewService.hideContextView(true), null, menuDisposables);
				menu.onDidBlur(() => this.contextViewService.hideContextView(true), null, menuDisposables);
				menuDisposables.add(addDisposableListener(window, EventType.BLUR, () => this.contextViewService.hideContextView(true)));
				menuDisposables.add(addDisposableListener(window, EventType.MOUSE_DOWN, (e: MouseEvent) => {
					if (e.defaultPrevented) {
						return;
					}

					let event = new StandardMouseEvent(e);
					let element: HTMLElement | null = event.target;

					// Don't do anything as we are likely creating a context menu
					if (event.rightButton) {
						return;
					}

					while (element) {
						if (element === container) {
							return;
						}

						element = element.parentElement;
					}

					this.contextViewService.hideContextView(true);
				}));

				return combinedDisposable(menuDisposables, menu);
			},

			focus: () => {
				if (menu) {
					menu.focus(!!delegate.autoSelectFirstItem);
				}
			},

			onHide: (didCancel?: boolean) => {
				if (delegate.onHide) {
					delegate.onHide(!!didCancel);
				}

				if (this.block) {
					this.block.remove();
					this.block = null;
				}

				if (this.focusToReturn) {
					this.focusToReturn.focus();
				}
			}
		}, shadowRootElement, !!shadowRootElement);
	}

	private onActionRun(e: IRunEvent): void {

		this.contextViewService.hideContextView(false);

		// Restore focus here
		if (this.focusToReturn) {
			this.focusToReturn.focus();
		}
	}

	private onDidActionRun(e: IRunEvent): void {
		if (e.error && !isPromiseCanceledError(e.error)) {
			this.notificationService.error(e.error);
		}
	}
}
