/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as browser from 'bg/base/browser/browser';
import * as platform from 'bg/base/common/platform';

export const enum KeyboardSupport {
	Always,
	FullScreen,
	None
}

/**
 * Browser feature we can support in current platform, browser and environment.
 */
export const BrowserFeatures = {
	clipboard: {
		writeText: (
			platform.isNative
			|| (document.queryCommandSupported && document.queryCommandSupported('copy'))
			|| !!(navigator && navigator.clipboard && navigator.clipboard.writeText)
		),
		readText: (
			platform.isNative
			|| !!(navigator && navigator.clipboard && navigator.clipboard.readText)
		)
	},
	keyboard: (() => {
		if (platform.isNative || browser.isStandalone) {
			return KeyboardSupport.Always;
		}

		if ((<any>navigator).keyboard || browser.isSafari) {
			return KeyboardSupport.FullScreen;
		}

		return KeyboardSupport.None;
	})(),

	// 'ontouchstart' in window always evaluates to true with typescript's modern typings. This causes `window` to be
	// `never` later in `window.navigator`. That's why we need the explicit `window as Window` cast
	touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
	pointerEvents: window.PointerEvent && ('ontouchstart' in window || (window as Window).navigator.maxTouchPoints > 0 || navigator.maxTouchPoints > 0)
};
