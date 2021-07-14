/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from 'bg/base/common/lifecycle';
import { createDecorator } from 'bg/platform/instantiation/common/instantiation';
import { IContextMenuDelegate } from 'bg/base/browser/contextmenu';
import { AnchorAlignment, AnchorAxisAlignment, IContextViewProvider } from 'bg/base/browser/ui/contextview/contextview';
import { Event } from 'bg/base/common/event';

export const IContextViewService = createDecorator<IContextViewService>('contextViewService');

export interface IContextViewService extends IContextViewProvider {

	readonly _serviceBrand: undefined;

	showContextView(delegate: IContextViewDelegate, container?: HTMLElement, shadowRoot?: boolean): IDisposable;
	hideContextView(data?: any): void;
	getContextViewElement(): HTMLElement;
	layout(): void;
	anchorAlignment?: AnchorAlignment;
}

export interface IContextViewDelegate {

	canRelayout?: boolean; // Default: true

	getAnchor(): HTMLElement | { x: number; y: number; width?: number; height?: number; };
	render(container: HTMLElement): IDisposable;
	onDOMEvent?(e: any, activeElement: HTMLElement): void;
	onHide?(data?: any): void;
	focus?(): void;
	anchorAlignment?: AnchorAlignment;
	anchorAxisAlignment?: AnchorAxisAlignment;
}

export const IContextMenuService = createDecorator<IContextMenuService>('contextMenuService');

export interface IContextMenuService {

	readonly _serviceBrand: undefined;

	readonly onDidShowContextMenu: Event<void>;

	showContextMenu(delegate: IContextMenuDelegate): void;
}
