/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Event } from 'bg/base/common/event';
import { URI } from 'bg/base/common/uri';
import { Disposable, IDisposable } from 'bg/base/common/lifecycle';
import { IEditorModel, IEditorOptions, IResourceEditorInput } from 'bg/platform/editor/common/editor';
import { IInstantiationService } from 'bg/platform/instantiation/common/instantiation';
import { IContextKeyService, RawContextKey } from 'bg/platform/contextkey/common/contextkey';
import { IEditorGroup } from 'bg/workbench/services/editor/common/editorGroupsService';
import { ICompositeControl, IComposite } from 'bg/workbench/common/composite';
import { IExtUri } from 'bg/base/common/resources';

// Static values for editor contributions
export const EditorExtensions = {
	EditorPane: 'workbench.contributions.editors',
	EditorFactory: 'workbench.contributions.editor.inputFactories'
};

// Static information regarding the text editor
export const DEFAULT_EDITOR_ASSOCIATION = {
	id: 'default',
	displayName: "Text Editor",
	providerDisplayName: "Built-in"
};

// Editor State Context Keys
export const ActiveEditorDirtyContext = new RawContextKey<boolean>('activeEditorIsDirty', false, "Whether the active editor is dirty");
export const ActiveEditorPinnedContext = new RawContextKey<boolean>('activeEditorIsNotPreview', false, "Whether the active editor is not in preview mode");
export const ActiveEditorStickyContext = new RawContextKey<boolean>('activeEditorIsPinned', false, "Whether the active editor is pinned");
export const ActiveEditorReadonlyContext = new RawContextKey<boolean>('activeEditorIsReadonly', false, "Whether the active editor is readonly");
export const ActiveEditorCanRevertContext = new RawContextKey<boolean>('activeEditorCanRevert', false, "Whether the active editor can revert");

// Editor Kind Context Keys
export const ActiveEditorContext = new RawContextKey<string | null>('activeEditor', null, { type: 'string', description: "The identifier of the active editor" });
export const ActiveEditorAvailableEditorIdsContext = new RawContextKey<string>('activeEditorAvailableEditorIds', '', "The available editor identifiers that are usable for the active editor");
export const TextCompareEditorVisibleContext = new RawContextKey<boolean>('textCompareEditorVisible', false, "Whether a text compare editor is visible");
export const TextCompareEditorActiveContext = new RawContextKey<boolean>('textCompareEditorActive', false, "Whether a text compare editor is active");

// Editor Group Context Keys
export const EditorGroupEditorsCountContext = new RawContextKey<number>('groupEditorsCount', 0, "The number of opened editor groups");
export const ActiveEditorGroupEmptyContext = new RawContextKey<boolean>('activeEditorGroupEmpty', false, "Whether the active editor group is empty");
export const ActiveEditorGroupIndexContext = new RawContextKey<number>('activeEditorGroupIndex', 0, "The index of the active editor group");
export const ActiveEditorGroupLastContext = new RawContextKey<boolean>('activeEditorGroupLast', false, "Whether the active editor group is the last group");
export const MultipleEditorGroupsContext = new RawContextKey<boolean>('multipleEditorGroups', false, "Whether there are multiple editor groups opened");
export const SingleEditorGroupsContext = MultipleEditorGroupsContext.toNegated();

// Editor Layout Context Keys
export const EditorsVisibleContext = new RawContextKey<boolean>('editorIsOpen', false, "Whether an editor is open");
export const InEditorZenModeContext = new RawContextKey<boolean>('inZenMode', false, "Whether Zen mode is enabled");
export const IsCenteredLayoutContext = new RawContextKey<boolean>('isCenteredLayout', false, "Whether centered layout is enabled");
export const SplitEditorsVertically = new RawContextKey<boolean>('splitEditorsVertically', false, "Whether editors split vertically");
export const EditorAreaVisibleContext = new RawContextKey<boolean>('editorAreaVisible', true, "Whether the editor area is visible");

/**
 * Text diff editor id.
 */
export const TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';

/**
 * Binary diff editor id.
 */
export const BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';

export interface IEditorDescriptor<T extends IEditorPane> {

	/**
	 * The unique type identifier of the editor. All instances
	 * of the same `IEditorPane` should have the same type
	 * identifier.
	 */
	readonly typeId: string;

	/**
	 * The display name of the editor.
	 */
	readonly name: string;

	/**
	 * Instantiates the editor pane using the provided services.
	 */
	instantiate(instantiationService: IInstantiationService): T;

	/**
	 * Whether the descriptor is for the provided editor pane.
	 */
	describes(editorPane: T): boolean;
}

/**
 * The editor pane is the container for workbench editors.
 */
export interface IEditorPane extends IComposite {

	/**
	 * The assigned input of this editor.
	 */
	readonly input: IEditorInput | undefined;

	/**
	 * The assigned options of the editor.
	 */
	readonly options: IEditorOptions | undefined;

	/**
	 * The assigned group this editor is showing in.
	 */
	readonly group: IEditorGroup | undefined;

	/**
	 * The minimum width of this editor.
	 */
	readonly minimumWidth: number;

	/**
	 * The maximum width of this editor.
	 */
	readonly maximumWidth: number;

	/**
	 * The minimum height of this editor.
	 */
	readonly minimumHeight: number;

	/**
	 * The maximum height of this editor.
	 */
	readonly maximumHeight: number;

	/**
	 * An event to notify whenever minimum/maximum width/height changes.
	 */
	readonly onDidChangeSizeConstraints: Event<{ width: number; height: number; } | undefined>;

	/**
	 * The context key service for this editor. Should be overridden by
	 * editors that have their own ScopedContextKeyService
	 */
	readonly scopedContextKeyService: IContextKeyService | undefined;

	/**
	 * Returns the underlying control of this editor. Callers need to cast
	 * the control to a specific instance as needed, e.g. by using the
	 * `isCodeEditor` helper method to access the text code editor.
	 */
	getControl(): IEditorControl | undefined;

	/**
	 * Finds out if this editor is visible or not.
	 */
	isVisible(): boolean;
}

/**
 * Overrides `IEditorPane` where `input` and `group` are known to be set.
 */
export interface IVisibleEditorPane extends IEditorPane {
	readonly input: IEditorInput;
	readonly group: IEditorGroup;
}

/**
 * Marker interface for the control inside an editor pane. Callers
 * have to cast the control to work with it, e.g. via methods
 * such as `isCodeEditor(control)`.
 */
export interface IEditorControl extends ICompositeControl { }

export interface IEditorSerializer {

	/**
	 * Determines whether the given editor can be serialized by the serializer.
	 */
	canSerialize(editor: IEditorInput): boolean;

	/**
	 * Returns a string representation of the provided editor that contains enough information
	 * to deserialize back to the original editor from the deserialize() method.
	 */
	serialize(editor: IEditorInput): string | undefined;

	/**
	 * Returns an editor from the provided serialized form of the editor. This form matches
	 * the value returned from the serialize() method.
	 */
	deserialize(instantiationService: IInstantiationService, serializedEditor: string): IEditorInput | undefined;
}

export function isResourceEditorInput(editor: unknown): editor is IResourceEditorInput {
	if (isEditorInput(editor)) {
		return false; // make sure to not accidentally match on typed editor inputs
	}

	const candidate = editor as IResourceEditorInput | undefined;

	return URI.isUri(candidate?.resource);
}

export const enum Verbosity {
	SHORT,
	MEDIUM,
	LONG
}

export const enum SaveReason {

	/**
	 * Explicit user gesture.
	 */
	EXPLICIT = 1,

	/**
	 * Auto save after a timeout.
	 */
	AUTO = 2,

	/**
	 * Auto save after editor focus change.
	 */
	FOCUS_CHANGE = 3,

	/**
	 * Auto save after window change.
	 */
	WINDOW_CHANGE = 4
}

export interface ISaveOptions {

	/**
	 * An indicator how the save operation was triggered.
	 */
	reason?: SaveReason;

	/**
	 * Forces to save the contents of the working copy
	 * again even if the working copy is not dirty.
	 */
	readonly force?: boolean;

	/**
	 * Instructs the save operation to skip any save participants.
	 */
	readonly skipSaveParticipants?: boolean;

	/**
	 * A hint as to which file systems should be available for saving.
	 */
	readonly availableFileSystems?: string[];
}

export interface IRevertOptions {

	/**
	 * Forces to load the contents of the working copy
	 * again even if the working copy is not dirty.
	 */
	readonly force?: boolean;

	/**
	 * A soft revert will clear dirty state of a working copy
	 * but will not attempt to load it from its persisted state.
	 *
	 * This option may be used in scenarios where an editor is
	 * closed and where we do not require to load the contents.
	 */
	readonly soft?: boolean;
}

export interface IMoveResult {
	editor: IEditorInput | IUntypedEditorInput;
	options?: IEditorOptions;
}

export const enum EditorInputCapabilities {

	/**
	 * Signals no specific capability for the input.
	 */
	None = 0,

	/**
	 * Signals that the input is readonly.
	 */
	Readonly = 1 << 1,

	/**
	 * Signals that the input can only be shown in one group
	 * and not be split into multiple groups.
	 */
	Singleton = 1 << 2,
}

export type IUntypedEditorInput = IResourceEditorInput;

export interface IEditorInput extends IDisposable {

	/**
	 * Triggered when this input is about to be disposed.
	 */
	readonly onWillDispose: Event<void>;

	/**
	 * Triggered when this input changes its dirty state.
	 */
	readonly onDidChangeDirty: Event<void>;

	/**
	 * Triggered when this input changes its label
	 */
	readonly onDidChangeLabel: Event<void>;

	/**
	 * Triggered when this input changes its capabilities.
	 */
	readonly onDidChangeCapabilities: Event<void>;

	/**
	 * Unique type identifier for this input. Every editor input of the
	 * same class should share the same type identifier. The type identifier
	 * is used for example for serialising/deserialising editor inputs
	 * via the serialisers of the `IEditorInputFactoryRegistry`.
	 */
	readonly typeId: string;

	/**
	 * Identifies the type of editor this input represents
	 * This ID is registered with the {@link EditorResolverService} to allow
	 * for resolving an untyped input to a typed one
	 */
	readonly editorId: string | undefined;

	/**
	 * Returns the optional associated resource of this input.
	 *
	 * This resource should be unique for all editors of the same
	 * kind and input and is often used to identify the editor input among
	 * others.
	 *
	 * **Note:** DO NOT use this property for anything but identity
	 * checks. DO NOT use this property to present as label to the user.
	 * Please refer to `EditorResourceAccessor` documentation in that case.
	 */
	readonly resource: URI | undefined;

	/**
	 * The capabilities of the input.
	 */
	readonly capabilities: EditorInputCapabilities;

	/**
	 * Figure out if the input has the provided capability.
	 */
	hasCapability(capability: EditorInputCapabilities): boolean;

	/**
	 * Returns the display name of this input.
	 */
	getName(): string;

	/**
	 * Returns the extra classes to apply to the label of this input.
	 */
	getLabelExtraClasses(): string[];

	/**
	 * Returns the display description of this input.
	 */
	getDescription(verbosity?: Verbosity): string | undefined;

	/**
	 * Returns the display title of this input.
	 */
	getTitle(verbosity?: Verbosity): string | undefined;

	/**
	 * Returns the aria label to be read out by a screen reader.
	 */
	getAriaLabel(): string;

	/**
	 * Returns a type of `IEditorModel` that represents the resolved input.
	 * Subclasses should override to provide a meaningful model or return
	 * `null` if the editor does not require a model.
	 */
	resolve(): Promise<IEditorModel | null>;

	/**
	 * Returns if this input is dirty or not.
	 */
	isDirty(): boolean;

	/**
	 * Returns if this input is currently being saved or soon to be
	 * saved. Based on this assumption the editor may for example
	 * decide to not signal the dirty state to the user assuming that
	 * the save is scheduled to happen anyway.
	 */
	isSaving(): boolean;

	/**
	 * Saves the editor. The provided groupId helps implementors
	 * to e.g. preserve view state of the editor and re-open it
	 * in the correct group after saving.
	 *
	 * @returns the resulting editor input (typically the same) of
	 * this operation or `undefined` to indicate that the operation
	 * failed or was canceled.
	 */
	save(group: GroupIdentifier, options?: ISaveOptions): Promise<IEditorInput | undefined>;

	/**
	 * Saves the editor to a different location. The provided `group`
	 * helps implementors to e.g. preserve view state of the editor
	 * and re-open it in the correct group after saving.
	 *
	 * @returns the resulting editor input (typically a different one)
	 * of this operation or `undefined` to indicate that the operation
	 * failed or was canceled.
	 */
	saveAs(group: GroupIdentifier, options?: ISaveOptions): Promise<IEditorInput | undefined>;

	/**
	 * Reverts this input from the provided group.
	 */
	revert(group: GroupIdentifier, options?: IRevertOptions): Promise<void>;

	/**
	 * Called to determine how to handle a resource that is renamed that matches
	 * the editors resource (or is a child of).
	 *
	 * Implementors are free to not implement this method to signal no intent
	 * to participate. If an editor is returned though, it will replace the
	 * current one with that editor and optional options.
	 */
	rename(group: GroupIdentifier, target: URI): IMoveResult | undefined;

	/**
	 * Returns a copy of the current editor input. Used when we can't just reuse the input
	 */
	copy(): IEditorInput;

	/**
	 * Returns a representation of this typed editor input as untyped
	 * resource editor input that e.g. can be used to serialize the
	 * editor input into a form that it can be restored.
	 *
	 * May return `undefined` if a untyped representatin is not supported.
	 *
	 * @param options additional configuration for the expected return type.
	 * When `preserveViewState` is provided, implementations should try to
	 * preserve as much view state as possible from the typed input based on
	 * the group the editor is opened.
	 */
	toUntyped(options?: { preserveViewState: GroupIdentifier }): IUntypedEditorInput | undefined;

	/**
	 * Returns if the other object matches this input.
	 */
	matches(other: IEditorInput | IUntypedEditorInput): boolean;

	/**
	 * Returns if this editor is disposed.
	 */
	isDisposed(): boolean;
}

export abstract class AbstractEditorInput extends Disposable {
	// Marker class for implementing `isEditorInput`
}

export function isEditorInput(editor: unknown): editor is IEditorInput {
	return editor instanceof AbstractEditorInput;
}

export interface IEditorInputWithPreferredResource {

	/**
	 * An editor may provide an additional preferred resource alongside
	 * the `resource` property. While the `resource` property serves as
	 * unique identifier of the editor that should be used whenever we
	 * compare to other editors, the `preferredResource` should be used
	 * in places where e.g. the resource is shown to the user.
	 *
	 * For example: on Windows and macOS, the same URI with different
	 * casing may point to the same file. The editor may chose to
	 * "normalize" the URIs so that only one editor opens for different
	 * URIs. But when displaying the editor label to the user, the
	 * preferred URI should be used.
	 *
	 * Not all editors have a `preferredResouce`. The `EditorResourceAccessor`
	 * utility can be used to always get the right resource without having
	 * to do instanceof checks.
	 */
	readonly preferredResource: URI;
}

function isEditorInputWithPreferredResource(editor: unknown): editor is IEditorInputWithPreferredResource {
	const candidate = editor as IEditorInputWithPreferredResource | undefined;

	return URI.isUri(candidate?.preferredResource);
}

export interface ISideBySideEditorInput extends IEditorInput {

	/**
	 * The primary editor input is shown on the right hand side.
	 */
	primary: IEditorInput;

	/**
	 * The secondary editor input is shown on the left hand side.
	 */
	secondary: IEditorInput;
}

export function isSideBySideEditorInput(editor: unknown): editor is ISideBySideEditorInput {
	const candidate = editor as ISideBySideEditorInput | undefined;

	return isEditorInput(candidate?.primary) && isEditorInput(candidate?.secondary);
}

export interface IEditorInputWithOptions {
	editor: IEditorInput;
	options?: IEditorOptions;
}

export interface IEditorInputWithOptionsAndGroup extends IEditorInputWithOptions {
	group: IEditorGroup;
}

export function isEditorInputWithOptions(editor: unknown): editor is IEditorInputWithOptions {
	const candidate = editor as IEditorInputWithOptions | undefined;

	return isEditorInput(candidate?.editor);
}

export function isEditorInputWithOptionsAndGroup(editor: unknown): editor is IEditorInputWithOptionsAndGroup {
	const candidate = editor as IEditorInputWithOptionsAndGroup | undefined;

	return isEditorInputWithOptions(editor) && candidate?.group !== undefined;
}

/**
 * Context passed into `EditorPane#setInput` to give additional
 * context information around why the editor was opened.
 */
export interface IEditorOpenContext {

	/**
	 * An indicator if the editor input is new for the group the editor is in.
	 * An editor is new for a group if it was not part of the group before and
	 * otherwise was already opened in the group and just became the active editor.
	 *
	 * This hint can e.g. be used to decide whether to restore view state or not.
	 */
	newInGroup?: boolean;
}

export interface IEditorIdentifier {
	groupId: GroupIdentifier;
	editor: IEditorInput;
}

export function isEditorIdentifier(identifier: unknown): identifier is IEditorIdentifier {
	const candidate = identifier as IEditorIdentifier | undefined;

	return typeof candidate?.groupId === 'number' && isEditorInput(candidate.editor);
}

/**
 * The editor commands context is used for editor commands (e.g. in the editor title)
 * and we must ensure that the context is serializable because it potentially travels
 * to the extension host!
 */
export interface IEditorCommandsContext {
	groupId: GroupIdentifier;
	editorIndex?: number;
}

export interface IEditorCloseEvent extends IEditorIdentifier {
	replaced: boolean;
	index: number;
	sticky: boolean;
}

export interface IEditorMoveEvent extends IEditorIdentifier {
	target: GroupIdentifier;
}

export interface IEditorOpenEvent extends IEditorIdentifier { }

export type GroupIdentifier = number;

export interface IWorkbenchEditorConfiguration {
	workbench?: {
		editor?: IEditorPartConfiguration,
		iconTheme?: string;
	};
}

interface IEditorPartConfiguration {
	showTabs?: boolean;
	wrapTabs?: boolean;
	scrollToSwitchTabs?: boolean;
	highlightModifiedTabs?: boolean;
	tabCloseButton?: 'left' | 'right' | 'off';
	tabSizing?: 'fit' | 'shrink';
	pinnedTabSizing?: 'normal' | 'compact' | 'shrink';
	titleScrollbarSizing?: 'default' | 'large';
	focusRecentEditorAfterClose?: boolean;
	showIcons?: boolean;
	enablePreview?: boolean;
	enablePreviewFromQuickOpen?: boolean;
	enablePreviewFromCodeNavigation?: boolean;
	closeOnFileDelete?: boolean;
	openPositioning?: 'left' | 'right' | 'first' | 'last';
	openSideBySideDirection?: 'right' | 'down';
	closeEmptyGroups?: boolean;
	revealIfOpen?: boolean;
	mouseBackForwardToNavigate?: boolean;
	labelFormat?: 'default' | 'short' | 'medium' | 'long';
	restoreViewState?: boolean;
	splitSizing?: 'split' | 'distribute';
	splitOnDragAndDrop?: boolean;
	limit?: {
		enabled?: boolean;
		value?: number;
		perEditorGroup?: boolean;
	};
	decorations?: {
		badges?: boolean;
		colors?: boolean;
	}
}

export interface IEditorPartOptions extends IEditorPartConfiguration {
	hasIcons?: boolean;
}

export interface IEditorPartOptionsChangeEvent {
	oldPartOptions: IEditorPartOptions;
	newPartOptions: IEditorPartOptions;
}

export enum SideBySideEditor {
	PRIMARY = 1,
	SECONDARY = 2,
	BOTH = 3
}

export interface IEditorResourceAccessorOptions {

	/**
	 * Allows to access the `resource(s)` of side by side editors. If not
	 * specified, a `resource` for a side by side editor will always be
	 * `undefined`.
	 */
	supportSideBySide?: SideBySideEditor;

	/**
	 * Allows to filter the scheme to consider. A resource scheme that does
	 * not match a filter will not be considered.
	 */
	filterByScheme?: string | string[];
}

class EditorResourceAccessorImpl {

	/**
	 * The original URI of an editor is the URI that was used originally to open
	 * the editor and should be used whenever the URI is presented to the user,
	 * e.g. as a label together with utility methods such as `ResourceLabel` or
	 * `ILabelService` that can turn this original URI into the best form for
	 * presenting.
	 *
	 * In contrast, the canonical URI (#getCanonicalUri) may be different and should
	 * be used whenever the URI is used to e.g. compare with other editors or when
	 * caching certain data based on the URI.
	 *
	 * For example: on Windows and macOS, the same file URI with different casing may
	 * point to the same file. The editor may chose to "normalize" the URI into a canonical
	 * form so that only one editor opens for same file URIs with different casing. As
	 * such, the original URI and the canonical URI can be different.
	 */
	getOriginalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null): URI | undefined;
	getOriginalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options: IEditorResourceAccessorOptions & { supportSideBySide?: SideBySideEditor.PRIMARY | SideBySideEditor.SECONDARY }): URI | undefined;
	getOriginalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options: IEditorResourceAccessorOptions & { supportSideBySide: SideBySideEditor.BOTH }): URI | { primary?: URI, secondary?: URI } | undefined;
	getOriginalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options?: IEditorResourceAccessorOptions): URI | { primary?: URI, secondary?: URI } | undefined {
		if (!editor) {
			return undefined;
		}

		// Original URI is the `preferredResource` of an editor if any
		const originalResource = isEditorInputWithPreferredResource(editor) ? editor.preferredResource : editor.resource;
		if (!originalResource || !options || !options.filterByScheme) {
			return originalResource;
		}

		return this.filterUri(originalResource, options.filterByScheme);
	}

	/**
	 * The canonical URI of an editor is the true unique identifier of the editor
	 * and should be used whenever the URI is used e.g. to compare with other
	 * editors or when caching certain data based on the URI.
	 *
	 * In contrast, the original URI (#getOriginalUri) may be different and should
	 * be used whenever the URI is presented to the user, e.g. as a label.
	 *
	 * For example: on Windows and macOS, the same file URI with different casing may
	 * point to the same file. The editor may chose to "normalize" the URI into a canonical
	 * form so that only one editor opens for same file URIs with different casing. As
	 * such, the original URI and the canonical URI can be different.
	 */
	getCanonicalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null): URI | undefined;
	getCanonicalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options: IEditorResourceAccessorOptions & { supportSideBySide?: SideBySideEditor.PRIMARY | SideBySideEditor.SECONDARY }): URI | undefined;
	getCanonicalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options: IEditorResourceAccessorOptions & { supportSideBySide: SideBySideEditor.BOTH }): URI | { primary?: URI, secondary?: URI } | undefined;
	getCanonicalUri(editor: IEditorInput | IUntypedEditorInput | undefined | null, options?: IEditorResourceAccessorOptions): URI | { primary?: URI, secondary?: URI } | undefined {
		if (!editor) {
			return undefined;
		}

		// Canonical URI is the `resource` of an editor
		const canonicalResource = editor.resource;
		if (!canonicalResource || !options || !options.filterByScheme) {
			return canonicalResource;
		}

		return this.filterUri(canonicalResource, options.filterByScheme);
	}

	private filterUri(resource: URI, filter: string | string[]): URI | undefined {

		// Multiple scheme filter
		if (Array.isArray(filter)) {
			if (filter.some(scheme => resource.scheme === scheme)) {
				return resource;
			}
		}

		// Single scheme filter
		else {
			if (filter === resource.scheme) {
				return resource;
			}
		}

		return undefined;
	}
}

export const EditorResourceAccessor = new EditorResourceAccessorImpl();

export const enum CloseDirection {
	LEFT,
	RIGHT
}

export interface IEditorMemento<T> {

	saveEditorState(group: IEditorGroup, resource: URI, state: T): void;
	saveEditorState(group: IEditorGroup, editor: IEditorInput, state: T): void;

	loadEditorState(group: IEditorGroup, resource: URI): T | undefined;
	loadEditorState(group: IEditorGroup, editor: IEditorInput): T | undefined;

	clearEditorState(resource: URI, group?: IEditorGroup): void;
	clearEditorState(editor: IEditorInput, group?: IEditorGroup): void;

	clearEditorStateOnDispose(resource: URI, editor: IEditorInput): void;

	moveEditorState(source: URI, target: URI, comparer: IExtUri): void;
}

export const enum EditorsOrder {

	/**
	 * Editors sorted by most recent activity (most recent active first)
	 */
	MOST_RECENTLY_ACTIVE,

	/**
	 * Editors sorted by sequential order
	 */
	SEQUENTIAL
}
