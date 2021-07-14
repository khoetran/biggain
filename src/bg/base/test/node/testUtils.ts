/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { join } from 'bg/base/common/path';
import { URI } from 'bg/base/common/uri';
import { generateUuid } from 'bg/base/common/uuid';
import * as testUtils from 'bg/base/test/common/testUtils';

export function getRandomTestPath(tmpdir: string, ...segments: string[]): string {
	return join(tmpdir, ...segments, generateUuid());
}

export function getPathFromAmdModule(requirefn: typeof require, relativePath: string): string {
	return URI.parse(requirefn.toUrl(relativePath)).fsPath;
}

export import flakySuite = testUtils.flakySuite;
