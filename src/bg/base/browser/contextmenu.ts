/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IAction, IActionRunner } from 'bg/base/common/actions';
import { ResolvedKeybinding } from 'bg/base/common/keyCodes';
import { AnchorAlignment, AnchorAxisAlignment } from 'bg/base/browser/ui/contextview/contextview';
import { IActionViewItem } from 'bg/base/browser/ui/actionbar/actionbar';

export interface IContextMenuEvent {
	readonly shiftKey?: boolean;
	readonly ctrlKey?: boolean;
	readonly altKey?: boolean;
	readonly metaKey?: boolean;
}

export interface IContextMenuDelegate {
	getAnchor(): HTMLElement | { x: number; y: number; width?: number; height?: number; };
	getActions(): readonly IAction[];
	getCheckedActionsRepresentation?(action: IAction): 'radio' | 'checkbox';
	getActionViewItem?(action: IAction): IActionViewItem | undefined;
	getActionsContext?(event?: IContextMenuEvent): unknown;
	getKeyBinding?(action: IAction): ResolvedKeybinding | undefined;
	getMenuClassName?(): string;
	onHide?(didCancel: boolean): void;
	actionRunner?: IActionRunner;
	autoSelectFirstItem?: boolean;
	anchorAlignment?: AnchorAlignment;
	anchorAxisAlignment?: AnchorAxisAlignment;
	domForShadowRoot?: HTMLElement;
}

export interface IContextMenuProvider {
	showContextMenu(delegate: IContextMenuDelegate): void;
}
