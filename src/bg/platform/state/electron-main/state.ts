/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'bg/platform/instantiation/common/instantiation';

export const IStateMainService = createDecorator<IStateMainService>('stateMainService');

export interface IStateMainService {

	readonly _serviceBrand: undefined;

	getItem<T>(key: string, defaultValue: T): T;
	getItem<T>(key: string, defaultValue?: T): T | undefined;

	setItem(key: string, data?: object | string | number | boolean | undefined | null): void;
	setItems(items: readonly { key: string, data?: object | string | number | boolean | undefined | null }[]): void;

	removeItem(key: string): void;

	close(): Promise<void>;
}
