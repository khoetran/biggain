/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'bg/css!./selectBox';

import { Event } from 'bg/base/common/event';
import { Widget } from 'bg/base/browser/ui/widget';
import { Color } from 'bg/base/common/color';
import { deepClone } from 'bg/base/common/objects';
import { IContentActionHandler } from 'bg/base/browser/formattedTextRenderer';
import { IContextViewProvider } from 'bg/base/browser/ui/contextview/contextview';
import { IListStyles } from 'bg/base/browser/ui/list/listWidget';
import { SelectBoxNative } from 'bg/base/browser/ui/selectBox/selectBoxNative';
import { SelectBoxList } from 'bg/base/browser/ui/selectBox/selectBoxCustom';
import { isMacintosh } from 'bg/base/common/platform';
import { IDisposable } from 'bg/base/common/lifecycle';


// Public SelectBox interface - Calls routed to appropriate select implementation class

export interface ISelectBoxDelegate extends IDisposable {

	// Public SelectBox Interface
	readonly onDidSelect: Event<ISelectData>;
	setOptions(options: ISelectOptionItem[], selected?: number): void;
	select(index: number): void;
	setAriaLabel(label: string): void;
	focus(): void;
	blur(): void;
	setFocusable(focus: boolean): void;

	// Delegated Widget interface
	render(container: HTMLElement): void;
	style(styles: ISelectBoxStyles): void;
	applyStyles(): void;
}

export interface ISelectBoxOptions {
	useCustomDrawn?: boolean;
	ariaLabel?: string;
	minBottomMargin?: number;
	optionsAsChildren?: boolean;
}

// Utilize optionItem interface to capture all option parameters
export interface ISelectOptionItem {
	text: string;
	detail?: string;
	decoratorRight?: string;
	description?: string;
	descriptionIsMarkdown?: boolean;
	descriptionMarkdownActionHandler?: IContentActionHandler;
	isDisabled?: boolean;
}

export interface ISelectBoxStyles extends IListStyles {
	selectBackground?: Color;
	selectListBackground?: Color;
	selectForeground?: Color;
	decoratorRightForeground?: Color;
	selectBorder?: Color;
	selectListBorder?: Color;
	focusBorder?: Color;
}

export const defaultStyles = {
	selectBackground: Color.fromHex('#3C3C3C'),
	selectForeground: Color.fromHex('#F0F0F0'),
	selectBorder: Color.fromHex('#3C3C3C')
};

export interface ISelectData {
	selected: string;
	index: number;
}

export class SelectBox extends Widget implements ISelectBoxDelegate {
	private selectBoxDelegate: ISelectBoxDelegate;

	constructor(options: ISelectOptionItem[], selected: number, contextViewProvider: IContextViewProvider, styles: ISelectBoxStyles = deepClone(defaultStyles), selectBoxOptions?: ISelectBoxOptions) {
		super();

		// Default to native SelectBox for OSX unless overridden
		if (isMacintosh && !selectBoxOptions?.useCustomDrawn) {
			this.selectBoxDelegate = new SelectBoxNative(options, selected, styles, selectBoxOptions);
		} else {
			this.selectBoxDelegate = new SelectBoxList(options, selected, contextViewProvider, styles, selectBoxOptions);
		}

		this._register(this.selectBoxDelegate);
	}

	// Public SelectBox Methods - routed through delegate interface

	get onDidSelect(): Event<ISelectData> {
		return this.selectBoxDelegate.onDidSelect;
	}

	setOptions(options: ISelectOptionItem[], selected?: number): void {
		this.selectBoxDelegate.setOptions(options, selected);
	}

	select(index: number): void {
		this.selectBoxDelegate.select(index);
	}

	setAriaLabel(label: string): void {
		this.selectBoxDelegate.setAriaLabel(label);
	}

	focus(): void {
		this.selectBoxDelegate.focus();
	}

	blur(): void {
		this.selectBoxDelegate.blur();
	}

	setFocusable(focusable: boolean): void {
		this.selectBoxDelegate.setFocusable(focusable);
	}

	render(container: HTMLElement): void {
		this.selectBoxDelegate.render(container);
	}

	style(styles: ISelectBoxStyles): void {
		this.selectBoxDelegate.style(styles);
	}

	applyStyles(): void {
		this.selectBoxDelegate.applyStyles();
	}
}
