/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { RawContextKey } from 'bg/platform/contextkey/common/contextkey';
import { isMacintosh, isLinux, isWindows, isWeb, isIOS } from 'bg/base/common/platform';

export const IsMacContext = new RawContextKey<boolean>('isMac', isMacintosh, "Whether the operating system is macOS");
export const IsLinuxContext = new RawContextKey<boolean>('isLinux', isLinux, "Whether the operating system is Linux");
export const IsWindowsContext = new RawContextKey<boolean>('isWindows', isWindows, "Whether the operating system is Windows");

export const IsWebContext = new RawContextKey<boolean>('isWeb', isWeb, "Whether the platform is a web browser");
export const IsMacNativeContext = new RawContextKey<boolean>('isMacNative', isMacintosh && !isWeb, "Whether the operating system is macOS on a non-browser platform");
export const IsIOSContext = new RawContextKey<boolean>('isIOS', isIOS, "Whether the operating system is IOS");

export const IsDevelopmentContext = new RawContextKey<boolean>('isDevelopment', false, true);

export const InputFocusedContextKey = 'inputFocus';
export const InputFocusedContext = new RawContextKey<boolean>(InputFocusedContextKey, false, "Whether keyboard focus is inside an input box");
