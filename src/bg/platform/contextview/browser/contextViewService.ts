/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IContextViewService, IContextViewDelegate } from './contextView';
import { ContextView, ContextViewDOMPosition } from 'bg/base/browser/ui/contextview/contextview';
import { Disposable, IDisposable, toDisposable } from 'bg/base/common/lifecycle';
import { ILayoutService } from 'bg/platform/layout/browser/layoutService';

export class ContextViewService extends Disposable implements IContextViewService {
	declare readonly _serviceBrand: undefined;

	private currentViewDisposable: IDisposable = Disposable.None;
	private contextView: ContextView;
	private container: HTMLElement;

	constructor(
		@ILayoutService readonly layoutService: ILayoutService
	) {
		super();

		this.container = layoutService.container;
		this.contextView = this._register(new ContextView(this.container, ContextViewDOMPosition.ABSOLUTE));
		this.layout();

		this._register(layoutService.onDidLayout(() => this.layout()));
	}

	// ContextView

	setContainer(container: HTMLElement, domPosition?: ContextViewDOMPosition): void {
		this.contextView.setContainer(container, domPosition || ContextViewDOMPosition.ABSOLUTE);
	}

	showContextView(delegate: IContextViewDelegate, container?: HTMLElement, shadowRoot?: boolean): IDisposable {
		if (container) {
			if (container !== this.container) {
				this.container = container;
				this.setContainer(container, shadowRoot ? ContextViewDOMPosition.FIXED_SHADOW : ContextViewDOMPosition.FIXED);
			}
		} else {
			if (this.container !== this.layoutService.container) {
				this.container = this.layoutService.container;
				this.setContainer(this.container, ContextViewDOMPosition.ABSOLUTE);
			}
		}

		this.contextView.show(delegate);

		const disposable = toDisposable(() => {
			if (this.currentViewDisposable === disposable) {
				this.hideContextView();
			}
		});

		this.currentViewDisposable = disposable;
		return disposable;
	}

	getContextViewElement(): HTMLElement {
		return this.contextView.getViewElement();
	}

	layout(): void {
		this.contextView.layout();
	}

	hideContextView(data?: any): void {
		this.contextView.hide(data);
	}
}
