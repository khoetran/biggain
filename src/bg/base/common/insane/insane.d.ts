/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

export interface InsaneOptions {
	readonly allowedSchemes?: readonly string[],
	readonly allowedTags?: readonly string[],
	readonly allowedAttributes?: { readonly [key: string]: string[] },
	readonly filter?: (token: { tag: string, attrs: { readonly [key: string]: string } }) => boolean,
}

export function insane(
	html: string,
	options?: InsaneOptions,
	strict?: boolean,
): string;
