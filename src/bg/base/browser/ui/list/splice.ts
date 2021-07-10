/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { ISpliceable } from 'bg/base/common/sequence';

export interface ISpreadSpliceable<T> {
	splice(start: number, deleteCount: number, ...elements: T[]): void;
}

export class CombinedSpliceable<T> implements ISpliceable<T> {

	constructor(private spliceables: ISpliceable<T>[]) { }

	splice(start: number, deleteCount: number, elements: T[]): void {
		this.spliceables.forEach(s => s.splice(start, deleteCount, elements));
	}
}
