/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'bg/css!./media/tree';
import { Iterable } from 'bg/base/common/iterator';
import { AbstractTree, IAbstractTreeOptions } from 'bg/base/browser/ui/tree/abstractTree';
import { IndexTreeModel, IList } from 'bg/base/browser/ui/tree/indexTreeModel';
import { ITreeElement, ITreeModel, ITreeNode, ITreeRenderer } from 'bg/base/browser/ui/tree/tree';
import { IListVirtualDelegate } from 'bg/base/browser/ui/list/list';

export interface IIndexTreeOptions<T, TFilterData = void> extends IAbstractTreeOptions<T, TFilterData> { }

export class IndexTree<T, TFilterData = void> extends AbstractTree<T, TFilterData, number[]> {

	protected override model!: IndexTreeModel<T, TFilterData>;

	constructor(
		user: string,
		container: HTMLElement,
		delegate: IListVirtualDelegate<T>,
		renderers: ITreeRenderer<T, TFilterData, any>[],
		private rootElement: T,
		options: IIndexTreeOptions<T, TFilterData> = {}
	) {
		super(user, container, delegate, renderers, options);
	}

	splice(location: number[], deleteCount: number, toInsert: Iterable<ITreeElement<T>> = Iterable.empty()): void {
		this.model.splice(location, deleteCount, toInsert);
	}

	rerender(location?: number[]): void {
		if (location === undefined) {
			this.view.rerender();
			return;
		}

		this.model.rerender(location);
	}

	updateElementHeight(location: number[], height: number): void {
		this.model.updateElementHeight(location, height);
	}

	protected createModel(user: string, view: IList<ITreeNode<T, TFilterData>>, options: IIndexTreeOptions<T, TFilterData>): ITreeModel<T, TFilterData, number[]> {
		return new IndexTreeModel(user, view, this.rootElement, options);
	}
}
