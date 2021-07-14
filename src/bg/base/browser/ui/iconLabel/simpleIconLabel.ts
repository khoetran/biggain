/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { reset } from 'bg/base/browser/dom';
import { renderLabelWithIcons } from 'bg/base/browser/ui/iconLabel/iconLabels';

export class SimpleIconLabel {

	constructor(
		private readonly _container: HTMLElement
	) { }

	set text(text: string) {
		reset(this._container, ...renderLabelWithIcons(text ?? ''));
	}

	set title(title: string) {
		this._container.title = title;
	}
}
