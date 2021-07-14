/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { HoverPosition } from 'bg/base/browser/ui/hover/hoverWidget';
import { IMarkdownString } from 'bg/base/common/htmlContent';
import { IDisposable } from 'bg/base/common/lifecycle';

export interface IHoverDelegateTarget extends IDisposable {
	readonly targetElements: readonly HTMLElement[];
	x?: number;
}

export interface IHoverDelegateOptions {
	text: IMarkdownString | string;
	target: IHoverDelegateTarget | HTMLElement;
	hoverPosition?: HoverPosition;
	showPointer?: boolean;
}

export interface IHoverDelegate {
	showHover(options: IHoverDelegateOptions): IDisposable | undefined;
	delay: number;
	placement?: 'mouse' | 'element';
}
