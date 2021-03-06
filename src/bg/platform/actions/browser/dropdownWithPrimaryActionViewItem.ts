/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IContextMenuProvider } from 'bg/base/browser/contextmenu';
import * as DOM from 'bg/base/browser/dom';
import { StandardKeyboardEvent } from 'bg/base/browser/keyboardEvent';
import { ActionViewItem, BaseActionViewItem } from 'bg/base/browser/ui/actionbar/actionViewItems';
import { DropdownMenuActionViewItem } from 'bg/base/browser/ui/dropdown/dropdownActionViewItem';
import { IAction } from 'bg/base/common/actions';
import { Event } from 'bg/base/common/event';
import { KeyCode } from 'bg/base/common/keyCodes';
import { MenuItemAction } from 'bg/platform/actions/common/actions';
import { MenuEntryActionViewItem } from 'bg/platform/actions/browser/menuEntryActionViewItem';
import { IKeybindingService } from 'bg/platform/keybinding/common/keybinding';
import { INotificationService } from 'bg/platform/notification/common/notification';
import { IContextKeyService } from 'bg/platform/contextkey/common/contextkey';

export class DropdownWithPrimaryActionViewItem extends BaseActionViewItem {
	private _primaryAction: ActionViewItem;
	private _dropdown: DropdownMenuActionViewItem;
	private _container: HTMLElement | null = null;
	private _dropdownContainer: HTMLElement | null = null;

	get onDidChangeDropdownVisibility(): Event<boolean> {
		return this._dropdown.onDidChangeVisibility;
	}

	constructor(
		primaryAction: MenuItemAction,
		dropdownAction: IAction,
		dropdownMenuActions: IAction[],
		className: string,
		private readonly _contextMenuProvider: IContextMenuProvider,
		@IKeybindingService _keybindingService: IKeybindingService,
		@INotificationService _notificationService: INotificationService,
		@IContextKeyService _contextKeyService: IContextKeyService
	) {
		super(null, primaryAction);
		this._primaryAction = new MenuEntryActionViewItem(primaryAction, undefined, _keybindingService, _notificationService, _contextKeyService);
		this._dropdown = new DropdownMenuActionViewItem(dropdownAction, dropdownMenuActions, this._contextMenuProvider, {
			menuAsChild: true,
			classNames: ['codicon', 'codicon-chevron-down']
		});
	}

	override setActionContext(newContext: unknown): void {
		super.setActionContext(newContext);
		this._primaryAction.setActionContext(newContext);
		this._dropdown.setActionContext(newContext);
	}

	override render(container: HTMLElement): void {
		this._container = container;
		super.render(this._container);
		this._container.classList.add('monaco-dropdown-with-primary');
		const primaryContainer = DOM.$('.action-container');
		this._primaryAction.render(DOM.append(this._container, primaryContainer));
		this._dropdownContainer = DOM.$('.dropdown-action-container');
		this._dropdown.render(DOM.append(this._container, this._dropdownContainer));
		this._register(DOM.addDisposableListener(primaryContainer, DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			const event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.RightArrow)) {
				this._primaryAction.element!.tabIndex = -1;
				this._dropdown.focus();
				event.stopPropagation();
			}
		}));
		this._register(DOM.addDisposableListener(this._dropdownContainer, DOM.EventType.KEY_DOWN, (e: KeyboardEvent) => {
			const event = new StandardKeyboardEvent(e);
			if (event.equals(KeyCode.LeftArrow)) {
				this._primaryAction.element!.tabIndex = 0;
				this._dropdown.setFocusable(false);
				this._primaryAction.element?.focus();
				event.stopPropagation();
			}
		}));
	}

	override focus(fromRight?: boolean): void {
		if (fromRight) {
			this._dropdown.focus();
		} else {
			this._primaryAction.element!.tabIndex = 0;
			this._primaryAction.element!.focus();
		}
	}

	override blur(): void {
		this._primaryAction.element!.tabIndex = -1;
		this._dropdown.blur();
		this._container!.blur();
	}

	override setFocusable(focusable: boolean): void {
		if (focusable) {
			this._primaryAction.element!.tabIndex = 0;
		} else {
			this._primaryAction.element!.tabIndex = -1;
			this._dropdown.setFocusable(false);
		}
	}

	update(dropdownAction: IAction, dropdownMenuActions: IAction[], dropdownIcon?: string): void {
		this._dropdown.dispose();
		this._dropdown = new DropdownMenuActionViewItem(dropdownAction, dropdownMenuActions, this._contextMenuProvider, {
			menuAsChild: true,
			classNames: ['codicon', dropdownIcon || 'codicon-chevron-down']
		});
		if (this._dropdownContainer) {
			this._dropdown.render(this._dropdownContainer);
		}
	}

	override dispose() {
		this._primaryAction.dispose();
		this._dropdown.dispose();
		super.dispose();
	}
}
