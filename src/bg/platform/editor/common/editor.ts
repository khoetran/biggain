/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'bg/base/common/uri';
import { Event } from 'bg/base/common/event';

export interface IDimension {
	width: number;
	height: number;
}

export interface IEditorModel {

	/**
	 * Emitted when the model is about to be disposed.
	 */
	readonly onWillDispose: Event<void>;

	/**
	 * Resolves the model.
	 */
	resolve(): Promise<void>;

	/**
	 * Find out if the editor model was resolved or not.
	 */
	isResolved(): boolean;

	/**
	 * Find out if this model has been disposed.
	 */
	isDisposed(): boolean;

	/**
	 * Dispose associated resources
	 */
	dispose(): void;
}

export interface IBaseResourceEditorInput {

	/**
	 * Optional options to use when opening the input.
	 */
	options?: IEditorOptions;

	/**
	 * Label to show for the input.
	 */
	readonly label?: string;

	/**
	 * Description to show for the input.
	 */
	readonly description?: string;
}

export interface IResourceEditorInput extends IBaseResourceEditorInput {

	/**
	 * The resource URI of the resource to open.
	 */
	readonly resource: URI;
}

/**
 * This identifier allows to uniquely identify an editor with a
 * resource, type and editor identifier.
 */
export interface IResourceEditorInputIdentifier {

	/**
	 * The type of the editor.
	 */
	readonly typeId: string;

	/**
	 * The identifier of the editor if provided.
	 */
	readonly editorId: string | undefined;

	/**
	 * The resource URI of the editor.
	 */
	readonly resource: URI;
}

export enum EditorActivation {

	/**
	 * Activate the editor after it opened. This will automatically restore
	 * the editor if it is minimized.
	 */
	ACTIVATE = 1,

	/**
	 * Only restore the editor if it is minimized but do not activate it.
	 *
	 * Note: will only work in combination with the `preserveFocus: true` option.
	 * Otherwise, if focus moves into the editor, it will activate and restore
	 * automatically.
	 */
	RESTORE,

	/**
	 * Preserve the current active editor.
	 *
	 * Note: will only work in combination with the `preserveFocus: true` option.
	 * Otherwise, if focus moves into the editor, it will activate and restore
	 * automatically.
	 */
	PRESERVE
}

export enum EditorResolution {

	/**
	 * Displays a picker and allows the user to decide which editor to use.
	 */
	PICK,

	/**
	 * Disables editor resolving.
	 */
	DISABLED,

	/**
	 * Only exclusive editors are considered.
	 */
	EXCLUSIVE_ONLY
}

export enum EditorOpenContext {

	/**
	 * Default: the editor is opening via a programmatic call
	 * to the editor service API.
	 */
	API,

	/**
	 * Indicates that a user action triggered the opening, e.g.
	 * via mouse or keyboard use.
	 */
	USER
}

export interface IEditorOptions {

	/**
	 * Tells the editor to not receive keyboard focus when the editor is being opened.
	 *
	 * Will also not activate the group the editor opens in unless the group is already
	 * the active one. This behaviour can be overridden via the `activation` option.
	 */
	preserveFocus?: boolean;

	/**
	 * This option is only relevant if an editor is opened into a group that is not active
	 * already and allows to control if the inactive group should become active, restored
	 * or preserved.
	 *
	 * By default, the editor group will become active unless `preserveFocus` or `inactive`
	 * is specified.
	 */
	activation?: EditorActivation;

	/**
	 * Tells the editor to reload the editor input in the editor even if it is identical to the one
	 * already showing. By default, the editor will not reload the input if it is identical to the
	 * one showing.
	 */
	forceReload?: boolean;

	/**
	 * Will reveal the editor if it is already opened and visible in any of the opened editor groups.
	 *
	 * Note that this option is just a hint that might be ignored if the user wants to open an editor explicitly
	 * to the side of another one or into a specific editor group.
	 */
	revealIfVisible?: boolean;

	/**
	 * Will reveal the editor if it is already opened (even when not visible) in any of the opened editor groups.
	 *
	 * Note that this option is just a hint that might be ignored if the user wants to open an editor explicitly
	 * to the side of another one or into a specific editor group.
	 */
	revealIfOpened?: boolean;

	/**
	 * An editor that is pinned remains in the editor stack even when another editor is being opened.
	 * An editor that is not pinned will always get replaced by another editor that is not pinned.
	 */
	pinned?: boolean;

	/**
	 * An editor that is sticky moves to the beginning of the editors list within the group and will remain
	 * there unless explicitly closed. Operations such as "Close All" will not close sticky editors.
	 */
	sticky?: boolean;

	/**
	 * The index in the document stack where to insert the editor into when opening.
	 */
	index?: number;

	/**
	 * An active editor that is opened will show its contents directly. Set to true to open an editor
	 * in the background without loading its contents.
	 *
	 * Will also not activate the group the editor opens in unless the group is already
	 * the active one. This behaviour can be overridden via the `activation` option.
	 */
	inactive?: boolean;

	/**
	 * Will not show an error in case opening the editor fails and thus allows to show a custom error
	 * message as needed. By default, an error will be presented as notification if opening was not possible.
	 */
	ignoreError?: boolean;

	/**
	 * Allows to override the editor that should be used to display the input:
	 * - `undefined`: let the editor decide for itself
	 * - `string`: specific override by id
	 * - `EditorResolution`: specific override handling
	 */
	override?: string | EditorResolution;

	/**
	 * A optional hint to signal in which context the editor opens.
	 *
	 * If configured to be `EditorOpenContext.USER`, this hint can be
	 * used in various places to control the experience. For example,
	 * if the editor to open fails with an error, a notification could
	 * inform about this in a modal dialog. If the editor opened through
	 * some background task, the notification would show in the background,
	 * not as a modal dialog.
	 */
	context?: EditorOpenContext;
}
