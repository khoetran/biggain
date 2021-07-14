/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'bg/css!./codicon/codicon';
import 'bg/css!./codicon/codicon-modifiers';

import { Codicon } from 'bg/base/common/codicons';

export function formatRule(c: Codicon) {
	let def = c.definition;
	while (def instanceof Codicon) {
		def = def.definition;
	}
	return `.codicon-${c.id}:before { content: '${def.fontCharacter}'; }`;
}
