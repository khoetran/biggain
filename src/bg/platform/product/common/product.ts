/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { FileAccess } from 'bg/base/common/network';
import { isWeb, globals } from 'bg/base/common/platform';
import { env } from 'bg/base/common/process';
import { dirname, joinPath } from 'bg/base/common/resources';
import { IProductConfiguration } from 'bg/base/common/product';
import { ISandboxConfiguration } from 'bg/base/parts/sandbox/common/sandboxTypes';

let product: IProductConfiguration;

// Native sandbox environment
if (typeof globals.biggain !== 'undefined' && typeof globals.biggain.context !== 'undefined') {
	const configuration: ISandboxConfiguration | undefined = globals.biggain.context.configuration();
	if (configuration) {
		product = configuration.product;
	} else {
		throw new Error('Sandbox: unable to resolve product configuration from preload script.');
	}
}

// Native node.js environment
else if (typeof require?.__$__nodeRequire === 'function') {

	// Obtain values from product.json and package.json
	const rootPath = dirname(FileAccess.asFileUri('', require));

	product = require.__$__nodeRequire(joinPath(rootPath, 'product.json').fsPath);
	const pkg = require.__$__nodeRequire(joinPath(rootPath, 'package.json').fsPath) as { version: string; };

	// Running out of sources
	if (env['BIGGAIN_DEV']) {
		Object.assign(product, {
			nameShort: `${product.nameShort} Dev`,
			nameLong: `${product.nameLong} Dev`,
			dataFolderName: `${product.dataFolderName}-dev`
		});
	}

	Object.assign(product, {
		version: pkg.version
	});
}

// Web environment or unknown
else {

	// Built time configuration (do NOT modify)
	product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/ } as IProductConfiguration;

	// Running out of sources
	if (Object.keys(product).length === 0) {
		Object.assign(product, {
			version: '1.0.0',
			nameShort: isWeb ? 'BigGain Web' : 'BigGain',
			nameLong: isWeb ? 'BigGain Web' : 'BigGain',
			applicationName: 'biggain',
			dataFolderName: '.biggain',
			urlProtocol: 'biggain',
			reportIssueUrl: 'https://github.com/khoetran/biggain/issues/new',
			licenseName: 'MIT',
			licenseUrl: 'https://github.com/khoetran/biggain/blob/main/LICENSE.txt',
		});
	}
}

export default product;
