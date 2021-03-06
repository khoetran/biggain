/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'bg/base/common/event';
import { Disposable, DisposableStore } from 'bg/base/common/lifecycle';
import { CancelablePromise, createCancelablePromise } from 'bg/base/common/async';

export class ActiveWindowManager extends Disposable {

	private readonly disposables = this._register(new DisposableStore());
	private firstActiveWindowIdPromise: CancelablePromise<number | undefined> | undefined;

	private activeWindowId: number | undefined;

	constructor({ onDidOpenWindow, onDidFocusWindow, getActiveWindowId }: {
		onDidOpenWindow: Event<number>,
		onDidFocusWindow: Event<number>,
		getActiveWindowId(): Promise<number | undefined>
	}) {
		super();

		// remember last active window id upon events
		const onActiveWindowChange = Event.latch(Event.any(onDidOpenWindow, onDidFocusWindow));
		onActiveWindowChange(this.setActiveWindow, this, this.disposables);

		// resolve current active window
		this.firstActiveWindowIdPromise = createCancelablePromise(() => getActiveWindowId());
		(async () => {
			try {
				const windowId = await this.firstActiveWindowIdPromise;
				this.activeWindowId = (typeof this.activeWindowId === 'number') ? this.activeWindowId : windowId;
			} catch (error) {
				// ignore
			} finally {
				this.firstActiveWindowIdPromise = undefined;
			}
		})();
	}

	private setActiveWindow(windowId: number | undefined) {
		if (this.firstActiveWindowIdPromise) {
			this.firstActiveWindowIdPromise.cancel();
			this.firstActiveWindowIdPromise = undefined;
		}

		this.activeWindowId = windowId;
	}

	async getActiveClientId(): Promise<string | undefined> {
		const id = this.firstActiveWindowIdPromise ? (await this.firstActiveWindowIdPromise) : this.activeWindowId;

		return `window:${id}`;
	}
}
