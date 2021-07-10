/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Color } from 'bg/base/common/color';

export type styleFn = (colors: { [name: string]: Color | undefined }) => void;

export interface IThemable {
	style: styleFn;
}
