/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Action } from 'bg/base/common/actions';
import { AsyncDataTree } from 'bg/base/browser/ui/tree/asyncDataTree';

export class CollapseAllAction<TInput, T, TFilterData = void> extends Action {

	constructor(private viewer: AsyncDataTree<TInput, T, TFilterData>, enabled: boolean) {
		super('vs.tree.collapse', "Collapse All", 'collapse-all', enabled);
	}

	override async run(): Promise<any> {
		this.viewer.collapseAll();
		this.viewer.setSelection([]);
		this.viewer.setFocus([]);
	}
}
