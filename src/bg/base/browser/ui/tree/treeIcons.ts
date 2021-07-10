/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Codicon, registerCodicon } from 'bg/base/common/codicons';

export const treeItemExpandedIcon = registerCodicon('tree-item-expanded', Codicon.chevronDown); // collapsed is done with rotation

export const treeFilterOnTypeOnIcon = registerCodicon('tree-filter-on-type-on', Codicon.listFilter);
export const treeFilterOnTypeOffIcon = registerCodicon('tree-filter-on-type-off', Codicon.listSelection);
export const treeFilterClearIcon = registerCodicon('tree-filter-clear', Codicon.close);

export const treeItemLoadingIcon = registerCodicon('tree-item-loading', Codicon.loading);
