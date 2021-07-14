/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { isFunction, isString } from 'bg/base/common/types';
import * as dom from 'bg/base/browser/dom';
import { IIconLabelMarkdownString } from 'bg/base/browser/ui/iconLabel/iconLabel';
import { IHoverDelegate, IHoverDelegateTarget } from 'bg/base/browser/ui/iconLabel/iconHoverDelegate';
import { CancellationToken, CancellationTokenSource } from 'bg/base/common/cancellation';
import { IDisposable, toDisposable } from 'bg/base/common/lifecycle';
import { HoverPosition } from 'bg/base/browser/ui/hover/hoverWidget';
import { IMarkdownString } from 'bg/base/common/htmlContent';
import { RunOnceScheduler } from 'bg/base/common/async';


export function setupNativeHover(htmlElement: HTMLElement, tooltip: string | IIconLabelMarkdownString | undefined): void {
	if (isString(tooltip)) {
		htmlElement.title = tooltip;
	} else if (tooltip?.markdownNotSupportedFallback) {
		htmlElement.title = tooltip.markdownNotSupportedFallback;
	} else {
		htmlElement.removeAttribute('title');
	}
}

export function setupCustomHover(hoverDelegate: IHoverDelegate, htmlElement: HTMLElement, markdownTooltip: string | IIconLabelMarkdownString | undefined): IDisposable | undefined {
	if (!markdownTooltip) {
		return undefined;
	}

	const tooltip = getTooltipForCustom(markdownTooltip);

	let hoverPreparation: IDisposable | undefined;

	let hoverWidget: IDisposable | undefined;

	const mouseEnter = (e: MouseEvent) => {
		if (hoverPreparation) {
			return;
		}

		const tokenSource = new CancellationTokenSource();

		const mouseLeaveOrDown = (e: MouseEvent) => {
			const isMouseDown = e.type === dom.EventType.MOUSE_DOWN;
			if (isMouseDown) {
				hoverWidget?.dispose();
				hoverWidget = undefined;
			}
			if (isMouseDown || (<any>e).fromElement === htmlElement) {
				hoverPreparation?.dispose();
				hoverPreparation = undefined;
			}
		};
		const mouseLeaveDomListener = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_LEAVE, mouseLeaveOrDown, true);
		const mouseDownDownListener = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_DOWN, mouseLeaveOrDown, true);

		const target: IHoverDelegateTarget = {
			targetElements: [htmlElement],
			dispose: () => { }
		};

		let mouseMoveDomListener: IDisposable | undefined;
		if (hoverDelegate.placement === undefined || hoverDelegate.placement === 'mouse') {
			const mouseMove = (e: MouseEvent) => target.x = e.x + 10;
			mouseMoveDomListener = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_MOVE, mouseMove, true);
		}

		const showHover = async () => {
			if (hoverPreparation) {

				const hoverOptions = {
					text: "Loading...",
					target,
					hoverPosition: HoverPosition.BELOW
				};
				hoverWidget?.dispose();
				hoverWidget = hoverDelegate.showHover(hoverOptions);

				const resolvedTooltip = (await tooltip(tokenSource.token)) ?? (!isString(markdownTooltip) ? markdownTooltip.markdownNotSupportedFallback : undefined);

				hoverWidget?.dispose();
				hoverWidget = undefined;

				// awaiting the tooltip could take a while. Make sure we're still preparing to hover.
				if (resolvedTooltip && hoverPreparation) {
					const hoverOptions = {
						text: resolvedTooltip,
						target,
						showPointer: hoverDelegate.placement === 'element',
						hoverPosition: HoverPosition.BELOW
					};

					hoverWidget = hoverDelegate.showHover(hoverOptions);
				}

			}
			mouseMoveDomListener?.dispose();
		};
		const timeout = new RunOnceScheduler(showHover, hoverDelegate.delay);
		timeout.schedule();

		hoverPreparation = toDisposable(() => {
			timeout.dispose();
			mouseMoveDomListener?.dispose();
			mouseDownDownListener.dispose();
			mouseLeaveDomListener.dispose();
			tokenSource.dispose(true);
		});
	};
	const mouseOverDomEmitter = dom.addDisposableListener(htmlElement, dom.EventType.MOUSE_OVER, mouseEnter, true);
	return toDisposable(() => {
		mouseOverDomEmitter.dispose();
		hoverPreparation?.dispose();
		hoverWidget?.dispose();
	});
}


function getTooltipForCustom(markdownTooltip: string | IIconLabelMarkdownString): (token: CancellationToken) => Promise<string | IMarkdownString | undefined> {
	if (isString(markdownTooltip)) {
		return async () => markdownTooltip;
	} else if (isFunction(markdownTooltip.markdown)) {
		return markdownTooltip.markdown;
	} else {
		const markdown = markdownTooltip.markdown;
		return async () => markdown;
	}
}
