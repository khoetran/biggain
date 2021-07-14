/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { NativeParsedArgs } from 'bg/platform/environment/common/argv';

/**
 * Returns the user data path to use with some rules:
 * - respect portable mode
 * - respect --user-data-dir CLI argument
 * - respect BIGGAIN_APPDATA environment variable
 */
export function getUserDataPath(args: NativeParsedArgs): string;
