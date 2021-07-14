/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from 'bg/base/common/lifecycle';
import { URI } from 'bg/base/common/uri';
import { createDecorator } from 'bg/platform/instantiation/common/instantiation';

export const IProtocolMainService = createDecorator<IProtocolMainService>('protocolMainService');

export interface IIPCObjectUrl<T> extends IDisposable {

	/**
	 * A `URI` that a renderer can use to retrieve the
	 * object via `ipcRenderer.invoke(resource.toString())`
	 */
	resource: URI;

	/**
	 * Allows to update the value of the object after it
	 * has been created.
	 *
	 * @param obj the object to make accessible to the
	 * renderer.
	 */
	update(obj: T): void;
}

export interface IProtocolMainService {

	readonly _serviceBrand: undefined;

	/**
	 * Allows to make an object accessible to a renderer
	 * via `ipcRenderer.invoke(resource.toString())`.
	 */
	createIPCObjectUrl<T>(): IIPCObjectUrl<T>;

	/**
	 * Adds a `URI` as root to the list of allowed
	 * resources for file access.
	 *
	 * @param root the URI to allow for file access
	 */
	addValidFileRoot(root: URI): IDisposable;
}
