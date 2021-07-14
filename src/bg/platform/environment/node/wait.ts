/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'bg/base/common/path';

export function createWaitMarkerFile(verbose?: boolean): string | undefined {
	const randomWaitMarkerPath = join(tmpdir(), Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10));

	try {
		fs.writeFileSync(randomWaitMarkerPath, ''); // use built-in fs to avoid dragging in more dependencies
		if (verbose) {
			console.log(`Marker file for --wait created: ${randomWaitMarkerPath}`);
		}
		return randomWaitMarkerPath;
	} catch (err) {
		if (verbose) {
			console.error(`Failed to create marker file for --wait: ${err}`);
		}
		return undefined;
	}
}
