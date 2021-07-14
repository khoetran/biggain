/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { webFrame } from 'bg/base/parts/sandbox/electron-sandbox/globals';
import { zoomLevelToZoomFactor } from 'bg/platform/windows/common/windows';
import { setZoomFactor, setZoomLevel, getZoomLevel } from 'bg/base/browser/browser';

/**
 * Apply a zoom level to the window. Also sets it in our in-memory
 * browser helper so that it can be accessed in non-electron layers.
 */
export function applyZoom(zoomLevel: number): void {
	webFrame.setZoomLevel(zoomLevel);
	setZoomFactor(zoomLevelToZoomFactor(zoomLevel));
	// Cannot be trusted because the webFrame might take some time
	// until it really applies the new zoom level
	setZoomLevel(zoomLevel, false /* isTrusted */);
}

export function zoomIn(): void {
	applyZoom(getZoomLevel() + 1);
}

export function zoomOut(): void {
	applyZoom(getZoomLevel() - 1);
}
