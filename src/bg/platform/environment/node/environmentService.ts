/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { homedir, tmpdir } from 'os';
import { NativeParsedArgs } from 'bg/platform/environment/common/argv';
import { getUserDataPath } from 'bg/platform/environment/node/userDataPath';
import { AbstractNativeEnvironmentService } from 'bg/platform/environment/common/environmentService';
import { IProductService } from 'bg/platform/product/common/productService';

export class NativeEnvironmentService extends AbstractNativeEnvironmentService {

	constructor(args: NativeParsedArgs, productService: IProductService) {
		super(args, {
			homeDir: homedir(),
			tmpDir: tmpdir(),
			userDataDir: getUserDataPath(args)
		}, productService);
	}
}
