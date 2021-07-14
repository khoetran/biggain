/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/
'use strict';

var define: {
	(moduleName: string, dependencies: string[], callback: (...args: any[]) => any): any;
	(moduleName: string, dependencies: string[], definition: any): any;
	(moduleName: string, callback: (...args: any[]) => any): any;
	(moduleName: string, definition: any): any;
	(dependencies: string[], callback: (...args: any[]) => any): any;
	(dependencies: string[], definition: any): any;
	amd: {
		jQuery: boolean;
	};
};

declare var doNotInitLoader: any;

const _amdLoaderGlobal = this;

declare var module: {
	exports: any;
};

declare var global: object;
const _commonjsGlobal = typeof global === 'object' ? global : {};

declare var Map: MapConstructor;

namespace AMDLoader {
	export const global: any = _amdLoaderGlobal

	//#region Environment
	export class Environment {

		private _detected: boolean;
		private _isWindows: boolean;
		private _isNode: boolean;
		private _isElectronRenderer: boolean;
		private _isWebWorker: boolean;

		public get isWindows(): boolean {
			this._detect();
			return this._isWindows;
		}
		public get isNode(): boolean {
			this._detect();
			return this._isNode;
		}
		public get isElectronRenderer(): boolean {
			this._detect();
			return this._isElectronRenderer;
		}
		public get isWebWorker(): boolean {
			this._detect();
			return this._isWebWorker;
		}

		constructor() {
			this._detected = false;
			this._isWindows = false;
			this._isNode = false;
			this._isElectronRenderer = false;
			this._isWebWorker = false;
		}

		private _detect(): void {
			if (this._detected) {
				return;
			}
			this._detected = true;
			this._isWindows = Environment._isWindows();
			this._isNode = (typeof module !== 'undefined' && !!module.exports);
			//@ts-ignore
			this._isElectronRenderer = (typeof process !== 'undefined' && typeof process.versions !== 'undefined' && typeof process.versions.electron !== 'undefined' && process.type === 'renderer');
			this._isWebWorker = (typeof global.importScripts === 'function');
		}

		private static _isWindows(): boolean {
			if (typeof navigator !== 'undefined') {
				if (navigator.userAgent && navigator.userAgent.indexOf('Windows') >= 0) {
					return true;
				}
			}
			if (typeof process !== 'undefined') {
				return (process.platform === 'win32');
			}
			return false;
		}
	}
	//#endregion

	//#region LoaderEvent
	export const enum LoaderEventType {
		LoaderAvailable = 1,

		BeginLoadingScript = 10,
		EndLoadingScriptOK = 11,
		EndLoadingScriptError = 12,

		BeginInvokeFactory = 21,
		EndInvokeFactory = 22,

		NodeBeginEvaluatingScript = 31,
		NodeEndEvaluatingScript = 32,

		NodeBeginNativeRequire = 33,
		NodeEndNativeRequire = 34,

		CachedDataFound = 60,
		CachedDataMissed = 61,
		CachedDataRejected = 62,
		CachedDataCreated = 63,
	}

	export class LoaderEvent {
		public type: LoaderEventType;
		public timestamp: number;
		public detail: string;

		constructor(type: LoaderEventType, detail: string, timestamp: number) {
			this.type = type;
			this.detail = detail;
			this.timestamp = timestamp;
		}
	}

	export interface ILoaderEventRecorder {
		record(type: LoaderEventType, detail: string): void;
		getEvents(): LoaderEvent[];
	}

	export class LoaderEventRecorder implements ILoaderEventRecorder {
		private _events: LoaderEvent[];

		constructor(loaderAvailableTimestamp: number) {
			this._events = [new LoaderEvent(LoaderEventType.LoaderAvailable, '', loaderAvailableTimestamp)];
		}

		public record(type: LoaderEventType, detail: string): void {
			this._events.push(new LoaderEvent(type, detail, Utilities.getHighPerformanceTimestamp()));
		}

		public getEvents(): LoaderEvent[] {
			return this._events;
		}
	}

	export class NullLoaderEventRecorder implements ILoaderEventRecorder {
		public static INSTANCE = new NullLoaderEventRecorder();

		public record(type: LoaderEventType, detail: string): void {
			// Nothing to do
		}

		public getEvents(): LoaderEvent[] {
			return [];
		}
	}
	//#endregion
	//#region Utilities
	export class Utilities {
		/**
		 * This method does not take care of / bg \
		 */
		public static fileUriToFilePath(isWindows: boolean, uri: string): string {
			uri = decodeURI(uri).replace(/%23/g, '#');
			if (isWindows) {
				if (/^file:\/\/\//.test(uri)) {
					// This is a URI without a hostname => return only the path segment
					return uri.substr(8);
				}
				if (/^file:\/\//.test(uri)) {
					return uri.substr(5);
				}
			} else {
				if (/^file:\/\//.test(uri)) {
					return uri.substr(7);
				}
			}
			// Not sure...
			return uri;
		}

		public static startsWith(haystack: string, needle: string): boolean {
			return haystack.length >= needle.length && haystack.substr(0, needle.length) === needle;
		}

		public static endsWith(haystack: string, needle: string): boolean {
			return haystack.length >= needle.length && haystack.substr(haystack.length - needle.length) === needle;
		}

		// only check for "?" before "#" to ensure that there is a real Query-String
		public static containsQueryString(url: string): boolean {
			return /^[^\#]*\?/gi.test(url);
		}

		/**
		 * Does `url` start with http:// or https:// or file:// or / ?
		 */
		public static isAbsolutePath(url: string): boolean {
			return /^((http:\/\/)|(https:\/\/)|(file:\/\/)|(\/))/.test(url);
		}

		public static forEachProperty(obj: any, callback: (key: string, value: any) => void): void {
			if (obj) {
				let key: string;
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						callback(key, obj[key]);
					}
				}
			}
		}

		public static isEmpty(obj: any): boolean {
			let isEmpty = true;
			Utilities.forEachProperty(obj, () => {
				isEmpty = false;
			});
			return isEmpty;
		}

		public static recursiveClone(obj: any): any {
			if (!obj || typeof obj !== 'object' || obj instanceof RegExp) {
				return obj;
			}
			if (!Array.isArray(obj) && Object.getPrototypeOf(obj) !== Object.prototype) {
				// only clone "simple" objects
				return obj;
			}
			let result: any = Array.isArray(obj) ? [] : {};
			Utilities.forEachProperty(obj, (key: string, value: any) => {
				if (value && typeof value === 'object') {
					result[key] = Utilities.recursiveClone(value);
				} else {
					result[key] = value;
				}
			});
			return result;
		}


		private static NEXT_ANONYMOUS_ID = 1;

		public static generateAnonymousModule(): string {
			return '===anonymous' + (Utilities.NEXT_ANONYMOUS_ID++) + '===';
		}

		public static isAnonymousModule(id: string): boolean {
			return Utilities.startsWith(id, '===anonymous');
		}

		private static PERFORMANCE_NOW_PROBED = false;
		private static HAS_PERFORMANCE_NOW = false;

		public static getHighPerformanceTimestamp(): number {
			if (!this.PERFORMANCE_NOW_PROBED) {
				this.PERFORMANCE_NOW_PROBED = true;
				this.HAS_PERFORMANCE_NOW = (global.performance && typeof global.performance.now === 'function');
			}
			return (this.HAS_PERFORMANCE_NOW ? global.performance.now() : Date.now());
		}
	}
	//#endregion

	//#region configuration
	export interface AnnotatedLoadingError extends Error {
		phase: 'loading';
		moduleId: string;
		neededBy: string[];
	}

	export interface AnnotatedFactoryError extends Error {
		phase: 'factory';
		moduleId: string;
	}

	export interface AnnotatedValidationError extends Error {
		phase: 'configuration';
	}

	export type AnnotatedError = AnnotatedLoadingError | AnnotatedFactoryError | AnnotatedValidationError;

	export function ensureError<T extends Error>(err: any): T {
		if (err instanceof Error) {
			return <T>err;
		}
		const result = new Error(err.message || String(err) || 'Unknown Error');
		if (err.stack) {
			result.stack = err.stack;
		}
		return <T>result;
	}

	/**
	 * The signature for the loader's AMD "define" function.
	 */
	export interface IDefineFunc {
		(id: 'string', dependencies: string[], callback: any): void;
		(id: 'string', callback: any): void;
		(dependencies: string[], callback: any): void;
		(callback: any): void;

		amd: {
			jQuery: boolean;
		};
	}

	/**
	 * The signature for the loader's AMD "require" function.
	 */
	export interface IRequireFunc {
		(module: string): any;
		(config: any): void;
		(modules: string[], callback: Function): void;
		(modules: string[], callback: Function, errorback: (err: any) => void): void;

		config(params: IConfigurationOptions, shouldOverwrite?: boolean): void;

		getConfig(): IConfigurationOptions;

		/**
		 * Non standard extension to reset completely the loader state. This is used for running amdjs tests
		 */
		reset(): void;

		/**
		 * Non standard extension to fetch loader state for building purposes.
		 */
		getBuildInfo(): IBuildModuleInfo[] | null;

		/**
		 * Non standard extension to fetch loader events
		 */
		getStats(): LoaderEvent[];

		/**
		 * The define function
		 */
		define(id: 'string', dependencies: string[], callback: any): void;
		define(id: 'string', callback: any): void;
		define(dependencies: string[], callback: any): void;
		define(callback: any): void;
	}

	export interface IModuleConfiguration {
		[key: string]: any;
	}

	export interface INodeRequire {
		(nodeModule: string): any;
		main: {
			filename: string;
		};
	}

	export interface INodeCachedDataConfiguration {
		/**
		 * Directory path in which cached is stored.
		 */
		path: string;
		/**
		 * Seed when generating names of cache files.
		 */
		seed?: string;
		/**
		 * Optional delay for filesystem write/delete operations
		 */
		writeDelay?: number;
	};

	export interface IConfigurationOptions {
		/**
		 * The prefix that will be aplied to all modules when they are resolved to a location
		 */
		baseUrl?: string;
		/**
		 * Redirect rules for modules. The redirect rules will affect the module ids themselves
		 */
		paths?: { [path: string]: any; };
		/**
		 * Per-module configuration
		 */
		config?: { [moduleId: string]: IModuleConfiguration };
		/**
		 * Catch errors when invoking the module factories
		 */
		catchError?: boolean;
		/**
		 * Record statistics
		 */
		recordStats?: boolean;
		/**
		 * The suffix that will be aplied to all modules when they are resolved to a location
		 */
		urlArgs?: string;
		/**
		 * Callback that will be called when errors are encountered
		 */
		onError?: (err: AnnotatedError) => void;
		/**
		 * The loader will issue warnings when duplicate modules are encountered.
		 * This list will inhibit those warnings if duplicate modules are expected.
		 */
		ignoreDuplicateModules?: string[];
		/**
		 * Flag to indicate if current execution is as part of a build. Used by plugins
		 */
		isBuild?: boolean;
		/**
		 * Content Security Policy nonce value used to load child scripts.
		 */
		cspNonce?: string;
		/**
		 * If running inside an electron renderer, prefer using <script> tags to load code.
		 * Defaults to false.
		 */
		preferScriptTags?: boolean;
		/**
		 * A trusted types policy which will be used to create TrustedScriptURL-values.
		 * https://w3c.github.io/webappsec-trusted-types/dist/spec/#introduction.
		 */
		trustedTypesPolicy?: {
			createScriptURL(value: string): string & object;
			createScript(_: string, value: string): string;
		};
		/**
		 * A regex to help determine if a module is an AMD module or a node module.
		 * If defined, then all amd modules in the system must match this regular expression.
		 */
		amdModulesPattern?: RegExp;
		/**
		 * A list of known node modules that should be directly loaded via node's require.
		 */
		nodeModules?: string[];
		/**
		 * The main entry point node's require
		 */
		nodeRequire?: INodeRequire;
		/**
		 * An optional transformation applied to the source before it is loaded in node's vm
		 */
		nodeInstrumenter?: (source: string, vmScriptSrc: string) => string;
		/**
		 * The main entry point.
		 */
		nodeMain?: string;
		/**
		* Support v8 cached data (http://v8project.blogspot.co.uk/2015/07/code-caching.html)
		*/
		nodeCachedData?: INodeCachedDataConfiguration
	}

	export interface IValidatedConfigurationOptions extends IConfigurationOptions {
		baseUrl: string;
		paths: { [path: string]: any; };
		config: { [moduleId: string]: IModuleConfiguration };
		catchError: boolean;
		recordStats: boolean;
		urlArgs: string;
		onError: (err: AnnotatedError) => void;
		ignoreDuplicateModules: string[];
		isBuild: boolean;
		cspNonce: string;
		preferScriptTags: boolean;
		nodeModules: string[];
	}

	export class ConfigurationOptionsUtil {

		/**
		 * Ensure configuration options make sense
		 */
		private static validateConfigurationOptions(options: IConfigurationOptions): IValidatedConfigurationOptions {

			function defaultOnError(err: AnnotatedError): void {
				if (err.phase === 'loading') {
					console.error('Loading "' + err.moduleId + '" failed');
					console.error(err);
					console.error('Here are the modules that depend on it:');
					console.error(err.neededBy);
					return;
				}

				if (err.phase === 'factory') {
					console.error('The factory method of "' + err.moduleId + '" has thrown an exception');
					console.error(err);
					return;
				}
			}

			options = options || {};
			if (typeof options.baseUrl !== 'string') {
				options.baseUrl = '';
			}
			if (typeof options.isBuild !== 'boolean') {
				options.isBuild = false;
			}
			if (typeof options.paths !== 'object') {
				options.paths = {};
			}
			if (typeof options.config !== 'object') {
				options.config = {};
			}
			if (typeof options.catchError === 'undefined') {
				options.catchError = false;
			}
			if (typeof options.recordStats === 'undefined') {
				options.recordStats = false;
			}
			if (typeof options.urlArgs !== 'string') {
				options.urlArgs = '';
			}
			if (typeof options.onError !== 'function') {
				options.onError = defaultOnError;
			}
			if (!Array.isArray(options.ignoreDuplicateModules)) {
				options.ignoreDuplicateModules = [];
			}
			if (options.baseUrl.length > 0) {
				if (!Utilities.endsWith(options.baseUrl, '/')) {
					options.baseUrl += '/';
				}
			}
			if (typeof options.cspNonce !== 'string') {
				options.cspNonce = '';
			}
			if (typeof options.preferScriptTags === 'undefined') {
				options.preferScriptTags = false;
			}
			if (!Array.isArray(options.nodeModules)) {
				options.nodeModules = [];
			}
			if (options.nodeCachedData && typeof options.nodeCachedData === 'object') {
				if (typeof options.nodeCachedData.seed !== 'string') {
					options.nodeCachedData.seed = 'seed';
				}
				if (typeof options.nodeCachedData.writeDelay !== 'number' || options.nodeCachedData.writeDelay < 0) {
					options.nodeCachedData.writeDelay = 1000 * 7;
				}
				if (!options.nodeCachedData.path || typeof options.nodeCachedData.path !== 'string') {
					const err = ensureError<AnnotatedValidationError>(new Error('INVALID cached data configuration, \'path\' MUST be set'));
					err.phase = 'configuration';
					options.onError(err);
					options.nodeCachedData = undefined;
				}
			}

			return <IValidatedConfigurationOptions>options;
		}

		public static mergeConfigurationOptions(overwrite: IConfigurationOptions | null = null, base: IConfigurationOptions | null = null): IValidatedConfigurationOptions {
			let result: IConfigurationOptions = Utilities.recursiveClone(base || {});

			// Merge known properties and overwrite the unknown ones
			Utilities.forEachProperty(overwrite, (key: string, value: any) => {
				if (key === 'ignoreDuplicateModules' && typeof result.ignoreDuplicateModules !== 'undefined') {
					result.ignoreDuplicateModules = result.ignoreDuplicateModules.concat(value);
				} else if (key === 'paths' && typeof result.paths !== 'undefined') {
					Utilities.forEachProperty(value, (key2: string, value2: any) => result.paths![key2] = value2);
				} else if (key === 'config' && typeof result.config !== 'undefined') {
					Utilities.forEachProperty(value, (key2: string, value2: any) => result.config![key2] = value2);
				} else {
					//@ts-ignore
					result[key] = Utilities.recursiveClone(value);
				}
			});

			return ConfigurationOptionsUtil.validateConfigurationOptions(result);
		}
	}

	export class Configuration {

		private readonly _env: Environment;

		private options: IValidatedConfigurationOptions;

		/**
		 * Generated from the `ignoreDuplicateModules` configuration option.
		 */
		//@ts-ignore
		private ignoreDuplicateModulesMap: { [moduleId: string]: boolean; };

		/**
		 * Generated from the `nodeModules` configuration option.
		 */
		//@ts-ignore
		private nodeModulesMap: { [nodeModuleId: string]: boolean };

		/**
		 * Generated from the `paths` configuration option. These are sorted with the longest `from` first.
		 */
		//@ts-ignore
		private sortedPathsRules: { from: string; to: string[]; }[];

		constructor(env: Environment, options?: IConfigurationOptions) {
			this._env = env;
			this.options = ConfigurationOptionsUtil.mergeConfigurationOptions(options);

			this._createIgnoreDuplicateModulesMap();
			this._createNodeModulesMap();
			this._createSortedPathsRules();

			if (this.options.baseUrl === '') {
				if (this.options.nodeRequire && this.options.nodeRequire.main && this.options.nodeRequire.main.filename && this._env.isNode) {
					let nodeMain = this.options.nodeRequire.main.filename;
					let dirnameIndex = Math.max(nodeMain.lastIndexOf('/'), nodeMain.lastIndexOf('\\'));
					this.options.baseUrl = nodeMain.substring(0, dirnameIndex + 1);
				}
				if (this.options.nodeMain && this._env.isNode) {
					let nodeMain = this.options.nodeMain;
					let dirnameIndex = Math.max(nodeMain.lastIndexOf('/'), nodeMain.lastIndexOf('\\'));
					this.options.baseUrl = nodeMain.substring(0, dirnameIndex + 1);
				}
			}
		}

		private _createIgnoreDuplicateModulesMap(): void {
			// Build a map out of the ignoreDuplicateModules array
			this.ignoreDuplicateModulesMap = {};
			for (let i = 0; i < this.options.ignoreDuplicateModules.length; i++) {
				this.ignoreDuplicateModulesMap[this.options.ignoreDuplicateModules[i]] = true;
			}
		}

		private _createNodeModulesMap(): void {
			// Build a map out of nodeModules array
			this.nodeModulesMap = Object.create(null);
			for (const nodeModule of this.options.nodeModules) {
				this.nodeModulesMap[nodeModule] = true;
			}
		}

		private _createSortedPathsRules(): void {
			// Create an array our of the paths rules, sorted descending by length to
			// result in a more specific -> less specific order
			this.sortedPathsRules = [];
			Utilities.forEachProperty(this.options.paths, (from: string, to: any) => {
				if (!Array.isArray(to)) {
					this.sortedPathsRules.push({
						from: from,
						to: [to]
					});
				} else {
					this.sortedPathsRules.push({
						from: from,
						to: to
					});
				}
			});
			this.sortedPathsRules.sort((a, b) => {
				return b.from.length - a.from.length;
			});
		}

		/**
		 * Clone current configuration and overwrite options selectively.
		 * @param options The selective options to overwrite with.
		 * @result A new configuration
		 */
		public cloneAndMerge(options?: IConfigurationOptions): Configuration {
			return new Configuration(this._env, ConfigurationOptionsUtil.mergeConfigurationOptions(options, this.options));
		}

		/**
		 * Get current options bag. Useful for passing it forward to plugins.
		 */
		public getOptionsLiteral(): IValidatedConfigurationOptions {
			return this.options;
		}

		private _applyPaths(moduleId: string): string[] {
			let pathRule: { from: string; to: string[]; };
			for (let i = 0, len = this.sortedPathsRules.length; i < len; i++) {
				pathRule = this.sortedPathsRules[i];
				if (Utilities.startsWith(moduleId, pathRule.from)) {
					let result: string[] = [];
					for (let j = 0, lenJ = pathRule.to.length; j < lenJ; j++) {
						result.push(pathRule.to[j] + moduleId.substr(pathRule.from.length));
					}
					return result;
				}
			}
			return [moduleId];
		}

		private _addUrlArgsToUrl(url: string): string {
			if (Utilities.containsQueryString(url)) {
				return url + '&' + this.options.urlArgs;
			} else {
				return url + '?' + this.options.urlArgs;
			}
		}

		private _addUrlArgsIfNecessaryToUrl(url: string): string {
			if (this.options.urlArgs) {
				return this._addUrlArgsToUrl(url);
			}
			return url;
		}

		private _addUrlArgsIfNecessaryToUrls(urls: string[]): string[] {
			if (this.options.urlArgs) {
				for (let i = 0, len = urls.length; i < len; i++) {
					urls[i] = this._addUrlArgsToUrl(urls[i]);
				}
			}
			return urls;
		}

		/**
		 * Transform a module id to a location. Appends .js to module ids
		 */
		public moduleIdToPaths(moduleId: string): string[] {

			const isNodeModule = (
				(this.nodeModulesMap[moduleId] === true)
				|| (this.options.amdModulesPattern instanceof RegExp && !this.options.amdModulesPattern.test(moduleId))
			);

			if (isNodeModule) {
				// This is a node module...
				if (this.isBuild()) {
					// ...and we are at build time, drop it
					return ['empty:'];
				} else {
					// ...and at runtime we create a `shortcut`-path
					return ['node|' + moduleId];
				}
			}

			let result = moduleId;

			let results: string[];
			if (!Utilities.endsWith(result, '.js') && !Utilities.isAbsolutePath(result)) {
				results = this._applyPaths(result);

				for (let i = 0, len = results.length; i < len; i++) {
					if (this.isBuild() && results[i] === 'empty:') {
						continue;
					}

					if (!Utilities.isAbsolutePath(results[i])) {
						results[i] = this.options.baseUrl + results[i];
					}

					if (!Utilities.endsWith(results[i], '.js') && !Utilities.containsQueryString(results[i])) {
						results[i] = results[i] + '.js';
					}
				}
			} else {
				if (!Utilities.endsWith(result, '.js') && !Utilities.containsQueryString(result)) {
					result = result + '.js';
				}
				results = [result];
			}

			return this._addUrlArgsIfNecessaryToUrls(results);
		}

		/**
		 * Transform a module id or url to a location.
		 */
		public requireToUrl(url: string): string {
			let result = url;

			if (!Utilities.isAbsolutePath(result)) {
				result = this._applyPaths(result)[0];

				if (!Utilities.isAbsolutePath(result)) {
					result = this.options.baseUrl + result;
				}
			}

			return this._addUrlArgsIfNecessaryToUrl(result);
		}

		/**
		 * Flag to indicate if current execution is as part of a build.
		 */
		public isBuild(): boolean {
			return this.options.isBuild;
		}

		/**
		 * Test if module `moduleId` is expected to be defined multiple times
		 */
		public isDuplicateMessageIgnoredFor(moduleId: string): boolean {
			return this.ignoreDuplicateModulesMap.hasOwnProperty(moduleId);
		}

		/**
		 * Get the configuration settings for the provided module id
		 */
		public getConfigForModule(moduleId: string): IModuleConfiguration | undefined {
			if (this.options.config) {
				return this.options.config[moduleId];
			}
			return;
		}

		/**
		 * Should errors be caught when executing module factories?
		 */
		public shouldCatchError(): boolean {
			return this.options.catchError;
		}

		/**
		 * Should statistics be recorded?
		 */
		public shouldRecordStats(): boolean {
			return this.options.recordStats;
		}

		/**
		 * Forward an error to the error handler.
		 */
		public onError(err: AnnotatedError): void {
			this.options.onError(err);
		}
	}
	//#endregion

	//#region scriptLoader
	export interface IModuleManager {
		getGlobalAMDDefineFunc(): IDefineFunc;
		getGlobalAMDRequireFunc(): IRequireFunc;
		getConfig(): Configuration;
		enqueueDefineAnonymousModule(dependencies: string[], callback: any): void;
		getRecorder(): ILoaderEventRecorder;
	}

	export interface IScriptLoader {
		load(moduleManager: IModuleManager, scriptPath: string, loadCallback: () => void, errorCallback: (err: any) => void): void;
	}

	interface IScriptCallbacks {
		callback: () => void;
		errorback: (err: any) => void;
	}

	/**
	 * Load `scriptSrc` only once (avoid multiple <script> tags)
	 */
	class OnlyOnceScriptLoader implements IScriptLoader {

		private readonly _env: Environment;
		private _scriptLoader: IScriptLoader | null;
		private readonly _callbackMap: { [scriptSrc: string]: IScriptCallbacks[]; };

		constructor(env: Environment) {
			this._env = env;
			this._scriptLoader = null;
			this._callbackMap = {};
		}

		public load(moduleManager: IModuleManager, scriptSrc: string, callback: () => void, errorback: (err: any) => void): void {
			if (!this._scriptLoader) {
				if (this._env.isWebWorker) {
					this._scriptLoader = new WorkerScriptLoader();
				} else if (this._env.isElectronRenderer) {
					const { preferScriptTags } = moduleManager.getConfig().getOptionsLiteral();
					if (preferScriptTags) {
						this._scriptLoader = new BrowserScriptLoader();
					} else {
						this._scriptLoader = new NodeScriptLoader(this._env);
					}
				} else if (this._env.isNode) {
					this._scriptLoader = new NodeScriptLoader(this._env);
				} else {
					this._scriptLoader = new BrowserScriptLoader();
				}
			}
			let scriptCallbacks: IScriptCallbacks = {
				callback: callback,
				errorback: errorback
			};
			if (this._callbackMap.hasOwnProperty(scriptSrc)) {
				this._callbackMap[scriptSrc].push(scriptCallbacks);
				return;
			}
			this._callbackMap[scriptSrc] = [scriptCallbacks];
			this._scriptLoader.load(moduleManager, scriptSrc, () => this.triggerCallback(scriptSrc), (err: any) => this.triggerErrorback(scriptSrc, err));
		}

		private triggerCallback(scriptSrc: string): void {
			let scriptCallbacks = this._callbackMap[scriptSrc];
			delete this._callbackMap[scriptSrc];

			for (let i = 0; i < scriptCallbacks.length; i++) {
				scriptCallbacks[i].callback();
			}
		}

		private triggerErrorback(scriptSrc: string, err: any): void {
			let scriptCallbacks = this._callbackMap[scriptSrc];
			delete this._callbackMap[scriptSrc];

			for (let i = 0; i < scriptCallbacks.length; i++) {
				scriptCallbacks[i].errorback(err);
			}
		}
	}

	class BrowserScriptLoader implements IScriptLoader {

		/**
		 * Attach load / error listeners to a script element and remove them when either one has fired.
		 * Implemented for browssers supporting HTML5 standard 'load' and 'error' events.
		 */
		private attachListeners(script: HTMLScriptElement, callback: () => void, errorback: (err: any) => void): void {
			let unbind = () => {
				script.removeEventListener('load', loadEventListener);
				script.removeEventListener('error', errorEventListener);
			};

			let loadEventListener = (e: any) => {
				unbind();
				callback();
			};

			let errorEventListener = (e: any) => {
				unbind();
				errorback(e);
			};

			script.addEventListener('load', loadEventListener);
			script.addEventListener('error', errorEventListener);
		}

		public load(moduleManager: IModuleManager, scriptSrc: string, callback: () => void, errorback: (err: any) => void): void {
			if (/^node\|/.test(scriptSrc)) {
				let opts = moduleManager.getConfig().getOptionsLiteral();
				let nodeRequire = ensureRecordedNodeRequire(moduleManager.getRecorder(), (opts.nodeRequire || AMDLoader.global.nodeRequire));
				let pieces = scriptSrc.split('|');

				let moduleExports: any = null;
				try {
					moduleExports = nodeRequire(pieces[1]);
				} catch (err) {
					errorback(err);
					return;
				}

				moduleManager.enqueueDefineAnonymousModule([], () => moduleExports);
				callback();
			} else {
				let script = document.createElement('script');
				script.setAttribute('async', 'async');
				script.setAttribute('type', 'text/javascript');

				this.attachListeners(script, callback, errorback);

				const { trustedTypesPolicy } = moduleManager.getConfig().getOptionsLiteral();
				if (trustedTypesPolicy) {
					scriptSrc = trustedTypesPolicy.createScriptURL(scriptSrc);
				}
				script.setAttribute('src', scriptSrc);

				// Propagate CSP nonce to dynamically created script tag.
				const { cspNonce } = moduleManager.getConfig().getOptionsLiteral();
				if (cspNonce) {
					script.setAttribute('nonce', cspNonce);
				}

				document.getElementsByTagName('head')[0].appendChild(script);
			}
		}
	}

	class WorkerScriptLoader implements IScriptLoader {

		public load(moduleManager: IModuleManager, scriptSrc: string, callback: () => void, errorback: (err: any) => void): void {

			const { trustedTypesPolicy } = moduleManager.getConfig().getOptionsLiteral();

			const isCrossOrigin = (/^((http:)|(https:)|(file:))/.test(scriptSrc) && scriptSrc.substring(0, self.origin.length) !== self.origin);
			if (!isCrossOrigin) {
				// use `fetch` if possible because `importScripts`
				// is synchronous and can lead to deadlocks on Safari
				fetch(scriptSrc).then((response) => {
					if (response.status !== 200) {
						throw new Error(response.statusText);
					}
					return response.text();
				}).then((text) => {
					text = `${text}\n//# sourceURL=${scriptSrc}`;
					const func = (
						trustedTypesPolicy
							? self.eval(trustedTypesPolicy.createScript('', text))
							: new Function(text)
					);
					func.call(self);
					callback();
				}).then(undefined, errorback);
				return;
			}

			try {
				if (trustedTypesPolicy) {
					scriptSrc = trustedTypesPolicy.createScriptURL(scriptSrc);
				}
				importScripts(scriptSrc);
				callback();
			}
			catch (e) {
				errorback(e);
			}
		}
	}

	declare class Buffer {
		static from(value: string, encoding?: string): Buffer;
		static allocUnsafe(size: number): Buffer;
		static concat(buffers: Buffer[], totalLength?: number): Buffer;
		length: number;
		writeInt32BE(value: number, offset: number): number;
		readInt32BE(offset: number): number;
		slice(start?: number, end?: number): Buffer;
		equals(b: Buffer): boolean;
		toString(): string;
	}

	interface INodeFS {
		readFile(filename: string, options: { encoding?: string; flag?: string }, callback: (err: any, data: any) => void): void;
		readFile(filename: string, callback: (err: any, data: Buffer) => void): void;
		readFileSync(filename: string): Buffer;
		writeFile(filename: string, data: Buffer, callback: (err: any) => void): void;
		unlink(path: string, callback: (err: any) => void): void;
	}

	interface INodeVMScriptOptions {
		filename: string;
		cachedData?: Buffer;
	}

	interface INodeVMScript {
		cachedData: Buffer;
		cachedDataProduced: boolean;
		cachedDataRejected: boolean;
		runInThisContext(options: INodeVMScriptOptions): any;
		createCachedData(): Buffer;
	}

	interface INodeVM {
		Script: { new(contents: string, options?: INodeVMScriptOptions): INodeVMScript }
		runInThisContext(contents: string, filename: string): any;
	}

	interface INodePath {
		dirname(filename: string): string;
		normalize(filename: string): string;
		basename(filename: string): string;
		join(...parts: string[]): string;
	}

	interface INodeCryptoHash {
		update(str: string, encoding: string): INodeCryptoHash;
		digest(type: string): string;
		digest(): Buffer;
	}
	interface INodeCrypto {
		createHash(type: string): INodeCryptoHash;
	}

	class NodeScriptLoader implements IScriptLoader {

		private static _BOM = 0xFEFF;
		private static _PREFIX = '(function (require, define, __filename, __dirname) { ';
		private static _SUFFIX = '\n});';

		private readonly _env: Environment;

		private _didPatchNodeRequire: boolean;
		private _didInitialize: boolean;
		//@ts-ignore
		private _fs: INodeFS;
		//@ts-ignore
		private _vm: INodeVM;
		//@ts-ignore
		private _path: INodePath;
		//@ts-ignore
		private _crypto: INodeCrypto;

		constructor(env: Environment) {
			this._env = env;
			this._didInitialize = false;
			this._didPatchNodeRequire = false;
		}

		private _init(nodeRequire: (nodeModule: string) => any): void {
			if (this._didInitialize) {
				return;
			}
			this._didInitialize = true;

			// capture node modules
			this._fs = nodeRequire('fs');
			this._vm = nodeRequire('vm');
			this._path = nodeRequire('path');
			this._crypto = nodeRequire('crypto');
		}

		// patch require-function of nodejs such that we can manually create a script
		// from cached data. this is done by overriding the `Module._compile` function
		private _initNodeRequire(nodeRequire: (nodeModule: string) => any, moduleManager: IModuleManager): void {
			// It is important to check for `nodeCachedData` first and then set `_didPatchNodeRequire`.
			// That's because `nodeCachedData` is set _after_ calling this for the first time...
			const { nodeCachedData } = moduleManager.getConfig().getOptionsLiteral();
			if (!nodeCachedData) {
				return;
			}
			if (this._didPatchNodeRequire) {
				return;
			}
			this._didPatchNodeRequire = true;

			const that = this
			const Module = nodeRequire('module');

			function makeRequireFunction(mod: any) {
				const Module = mod.constructor;
				let require = <any>function require(path: string) {
					try {
						return mod.require(path);
					} finally {
						// nothing
					}
				}
				require.resolve = function resolve(request: string, options: any) {
					return Module._resolveFilename(request, mod, false, options);
				};
				require.resolve.paths = function paths(request: string) {
					return Module._resolveLookupPaths(request, mod);
				};
				require.main = process.mainModule;
				require.extensions = Module._extensions;
				require.cache = Module._cache;
				return require;
			}

			Module.prototype._compile = function (content: string, filename: string) {
				// remove shebang and create wrapper function
				const scriptSource = Module.wrap(content.replace(/^#!.*/, ''));

				// create script
				const recorder = moduleManager.getRecorder();
				const cachedDataPath = that._getCachedDataPath(nodeCachedData, filename);
				const options: INodeVMScriptOptions = { filename };
				let hashData: Buffer | undefined;
				try {
					const data = that._fs.readFileSync(cachedDataPath);
					hashData = data.slice(0, 16);
					options.cachedData = data.slice(16);
					recorder.record(LoaderEventType.CachedDataFound, cachedDataPath);
				} catch (_e) {
					recorder.record(LoaderEventType.CachedDataMissed, cachedDataPath);
				}
				const script = new that._vm.Script(scriptSource, options);
				const compileWrapper = script.runInThisContext(options);

				// run script
				const dirname = that._path.dirname(filename);
				const require = makeRequireFunction(this);
				const args = [this.exports, require, this, filename, dirname, process, _commonjsGlobal, Buffer];
				const result = compileWrapper.apply(this.exports, args);

				// cached data aftermath
				that._handleCachedData(script, scriptSource, cachedDataPath, !options.cachedData, moduleManager);
				that._verifyCachedData(script, scriptSource, cachedDataPath!, hashData, moduleManager);

				return result;
			}
		}

		public load(moduleManager: IModuleManager, scriptSrc: string, callback: () => void, errorback: (err: any) => void): void {
			const opts = moduleManager.getConfig().getOptionsLiteral();
			const nodeRequire = ensureRecordedNodeRequire(moduleManager.getRecorder(), (opts.nodeRequire || global.nodeRequire));
			const nodeInstrumenter = (opts.nodeInstrumenter || function (c) { return c; });
			this._init(nodeRequire);
			this._initNodeRequire(nodeRequire, moduleManager);
			let recorder = moduleManager.getRecorder();

			if (/^node\|/.test(scriptSrc)) {

				let pieces = scriptSrc.split('|');

				let moduleExports: any = null;
				try {
					moduleExports = nodeRequire(pieces[1]);
				} catch (err) {
					errorback(err);
					return;
				}

				moduleManager.enqueueDefineAnonymousModule([], () => moduleExports);
				callback();

			} else {

				scriptSrc = Utilities.fileUriToFilePath(this._env.isWindows, scriptSrc);
				const normalizedScriptSrc = this._path.normalize(scriptSrc);
				const vmScriptPathOrUri = this._getElectronRendererScriptPathOrUri(normalizedScriptSrc);
				const wantsCachedData = Boolean(opts.nodeCachedData);
				const cachedDataPath = wantsCachedData ? this._getCachedDataPath(opts.nodeCachedData!, scriptSrc) : undefined;

				this._readSourceAndCachedData(normalizedScriptSrc, cachedDataPath, recorder, (err?: any, data?: string, cachedData?: Buffer, hashData?: Buffer) => {
					if (err) {
						errorback(err);
						return;
					}
					if (!data) {
						return;
					}

					let scriptSource: string;
					if (data.charCodeAt(0) === NodeScriptLoader._BOM) {
						scriptSource = NodeScriptLoader._PREFIX + data.substring(1) + NodeScriptLoader._SUFFIX;
					} else {
						scriptSource = NodeScriptLoader._PREFIX + data + NodeScriptLoader._SUFFIX;
					}

					scriptSource = nodeInstrumenter(scriptSource, normalizedScriptSrc);
					const scriptOpts: INodeVMScriptOptions = { filename: vmScriptPathOrUri, cachedData };
					const script = this._createAndEvalScript(moduleManager, scriptSource, scriptOpts, callback, errorback);

					this._handleCachedData(script, scriptSource, cachedDataPath!, wantsCachedData && !cachedData, moduleManager);
					this._verifyCachedData(script, scriptSource, cachedDataPath!, hashData, moduleManager);
				});
			}
		}

		private _createAndEvalScript(moduleManager: IModuleManager, contents: string, options: INodeVMScriptOptions, callback: () => void, errorback: (err: any) => void): INodeVMScript {
			const recorder = moduleManager.getRecorder();
			recorder.record(LoaderEventType.NodeBeginEvaluatingScript, options.filename);

			const script = new this._vm.Script(contents, options);
			const ret = script.runInThisContext(options);

			const globalDefineFunc = moduleManager.getGlobalAMDDefineFunc();
			let receivedDefineCall = false;
			const localDefineFunc: IDefineFunc = <any>function () {
				receivedDefineCall = true;
				return globalDefineFunc.apply(null, arguments as any);
			};
			localDefineFunc.amd = globalDefineFunc.amd;

			ret.call(global, moduleManager.getGlobalAMDRequireFunc(), localDefineFunc, options.filename, this._path.dirname(options.filename));

			recorder.record(LoaderEventType.NodeEndEvaluatingScript, options.filename);

			if (receivedDefineCall) {
				callback();
			} else {
				errorback(new Error(`Didn't receive define call in ${options.filename}!`));
			}

			return script;
		}

		private _getElectronRendererScriptPathOrUri(path: string) {
			if (!this._env.isElectronRenderer) {
				return path;
			}
			let driveLetterMatch = path.match(/^([a-z])\:(.*)/i);
			if (driveLetterMatch) {
				// windows
				return `file:///${(driveLetterMatch[1].toUpperCase() + ':' + driveLetterMatch[2]).replace(/\\/g, '/')}`;
			} else {
				// nix
				return `file://${path}`;
			}
		}

		private _getCachedDataPath(config: INodeCachedDataConfiguration, filename: string): string {
			const hash = this._crypto.createHash('md5').update(filename, 'utf8').update(config.seed!, 'utf8').update(process.arch, '').digest('hex');
			const basename = this._path.basename(filename).replace(/\.js$/, '');
			return this._path.join(config.path, `${basename}-${hash}.code`);
		}

		private _handleCachedData(script: INodeVMScript, scriptSource: string, cachedDataPath: string, createCachedData: boolean, moduleManager: IModuleManager): void {
			if (script.cachedDataRejected) {
				// cached data got rejected -> delete and re-create
				this._fs.unlink(cachedDataPath, err => {
					moduleManager.getRecorder().record(LoaderEventType.CachedDataRejected, cachedDataPath);
					this._createAndWriteCachedData(script, scriptSource, cachedDataPath, moduleManager);
					if (err) {
						moduleManager.getConfig().onError(err)
					}
				});
			} else if (createCachedData) {
				// no cached data, but wanted
				this._createAndWriteCachedData(script, scriptSource, cachedDataPath, moduleManager);
			}
		}

		// Cached data format: | SOURCE_HASH | V8_CACHED_DATA |
		// -SOURCE_HASH is the md5 hash of the JS source (always 16 bytes)
		// -V8_CACHED_DATA is what v8 produces

		private _createAndWriteCachedData(script: INodeVMScript, scriptSource: string, cachedDataPath: string, moduleManager: IModuleManager): void {

			let timeout: number = Math.ceil(moduleManager.getConfig().getOptionsLiteral().nodeCachedData!.writeDelay! * (1 + Math.random()));
			let lastSize: number = -1;
			let iteration: number = 0;
			let hashData: Buffer | undefined = undefined;

			const createLoop = () => {
				setTimeout(() => {

					if (!hashData) {
						hashData = this._crypto.createHash('md5').update(scriptSource, 'utf8').digest();
					}

					const cachedData = script.createCachedData();
					if (cachedData.length === 0 || cachedData.length === lastSize || iteration >= 5) {
						// done
						return;
					}

					if (cachedData.length < lastSize) {
						// less data than before: skip, try again next round
						createLoop();
						return;
					}

					lastSize = cachedData.length;
					this._fs.writeFile(cachedDataPath, Buffer.concat([hashData, cachedData]), err => {
						if (err) {
							moduleManager.getConfig().onError(err);
						}
						moduleManager.getRecorder().record(LoaderEventType.CachedDataCreated, cachedDataPath);
						createLoop();
					});
				}, timeout * (4 ** iteration++));
			};

			// with some delay (`timeout`) create cached data
			// and repeat that (with backoff delay) until the
			// data seems to be not changing anymore
			createLoop();
		}

		private _readSourceAndCachedData(sourcePath: string, cachedDataPath: string | undefined, recorder: ILoaderEventRecorder, callback: (err?: any, source?: string, cachedData?: Buffer, hashData?: Buffer) => any): void {

			if (!cachedDataPath) {
				// no cached data case
				this._fs.readFile(sourcePath, { encoding: 'utf8' }, callback);

			} else {
				// cached data case: read both files in parallel
				let source: string | undefined = undefined;
				let cachedData: Buffer | undefined = undefined;
				let hashData: Buffer | undefined = undefined;
				let steps = 2;

				const step = (err?: any) => {
					if (err) {
						callback(err);

					} else if (--steps === 0) {
						callback(undefined, source, cachedData, hashData);
					}
				}

				this._fs.readFile(sourcePath, { encoding: 'utf8' }, (err: any, data: string) => {
					source = data;
					step(err);
				});

				this._fs.readFile(cachedDataPath, (err: any, data: Buffer) => {
					if (!err && data && data.length > 0) {
						hashData = data.slice(0, 16);
						cachedData = data.slice(16);
						recorder.record(LoaderEventType.CachedDataFound, cachedDataPath);

					} else {
						recorder.record(LoaderEventType.CachedDataMissed, cachedDataPath);
					}
					step(); // ignored: cached data is optional
				});
			}
		}

		private _verifyCachedData(script: INodeVMScript, scriptSource: string, cachedDataPath: string, hashData: Buffer | undefined, moduleManager: IModuleManager): void {
			if (!hashData) {
				// nothing to do
				return;
			}
			if (script.cachedDataRejected) {
				// invalid anyways
				return;
			}
			setTimeout(() => {
				// check source hash - the contract is that file paths change when file content
				// change (e.g use the commit or version id as cache path). this check is
				// for violations of this contract.
				const hashDataNow = this._crypto.createHash('md5').update(scriptSource, 'utf8').digest();
				if (!hashData.equals(hashDataNow)) {
					moduleManager.getConfig().onError(<any>new Error(`FAILED TO VERIFY CACHED DATA, deleting stale '${cachedDataPath}' now, but a RESTART IS REQUIRED`));
					this._fs.unlink(cachedDataPath!, err => {
						if (err) {
							moduleManager.getConfig().onError(err);
						}
					});
				}

			}, Math.ceil(5000 * (1 + Math.random())));
		}
	}

	export function ensureRecordedNodeRequire(recorder: ILoaderEventRecorder, _nodeRequire: (nodeModule: string) => any): (nodeModule: string) => any {
		if ((<any>_nodeRequire).__$__isRecorded) {
			// it is already recorded
			return _nodeRequire;
		}

		const nodeRequire = function nodeRequire(what: any) {
			recorder.record(LoaderEventType.NodeBeginNativeRequire, what);
			try {
				return _nodeRequire(what);
			} finally {
				recorder.record(LoaderEventType.NodeEndNativeRequire, what);
			}
		};
		(<any>nodeRequire).__$__isRecorded = true;
		return nodeRequire;
	}

	export function createScriptLoader(env: Environment): IScriptLoader {
		return new OnlyOnceScriptLoader(env);
	}
	//#endregion

	//#region moduleManager
	export interface ILoaderPlugin {
		load: (pluginParam: string, parentRequire: IRelativeRequire, loadCallback: IPluginLoadCallback, options: IConfigurationOptions) => void;
		// write?: (pluginName: string, moduleName: string, write: IPluginWriteCallback) => void;
		// writeFile?: (pluginName: string, moduleName: string, req: IRelativeRequire, write: IPluginWriteFileCallback, config: IConfigurationOptions) => void;
		// finishBuild?: (write: (filename: string, contents: string) => void) => void;
	}

	export interface IDefineCall {
		stack: string | null;
		dependencies: string[];
		callback: any;
	}

	export interface IRelativeRequire {
		(dependencies: string[], callback: Function): void;
		(dependency: string): any;
		toUrl(id: string): string;
		getStats(): LoaderEvent[];
		hasDependencyCycle(): boolean;
		getChecksums(): { [scriptSrc: string]: string };
		config(params: IConfigurationOptions, shouldOverwrite?: boolean): void;
	}

	export interface IPluginLoadCallback {
		(value: any): void;
		error(err: any): void;
	}

	export interface IPluginWriteCallback {
		(contents: string): void;
		getEntryPoint(): string;
		asModule(moduleId: string, contents: string): void;
	}

	export interface IPluginWriteFileCallback {
		(filename: string, contents: string): void;
		getEntryPoint(): string;
		asModule(moduleId: string, contents: string): void;
	}

	// ------------------------------------------------------------------------
	// ModuleIdResolver

	export class ModuleIdResolver {

		public static ROOT = new ModuleIdResolver('');

		private fromModulePath: string;

		constructor(fromModuleId: string) {
			let lastSlash = fromModuleId.lastIndexOf('/');
			if (lastSlash !== -1) {
				this.fromModulePath = fromModuleId.substr(0, lastSlash + 1);
			} else {
				this.fromModulePath = '';
			}
		}

		/**
		 * Normalize 'a/../name' to 'name', etc.
		 */
		static _normalizeModuleId(moduleId: string): string {
			let r = moduleId,
				pattern: RegExp;

			// replace /./ => /
			pattern = /\/\.\//;
			while (pattern.test(r)) {
				r = r.replace(pattern, '/');
			}

			// replace ^./ => nothing
			r = r.replace(/^\.\//g, '');

			// replace /aa/../ => / (BUT IGNORE /../../)
			pattern = /\/(([^\/])|([^\/][^\/\.])|([^\/\.][^\/])|([^\/][^\/][^\/]+))\/\.\.\//;
			while (pattern.test(r)) {
				r = r.replace(pattern, '/');
			}

			// replace ^aa/../ => nothing (BUT IGNORE ../../)
			r = r.replace(/^(([^\/])|([^\/][^\/\.])|([^\/\.][^\/])|([^\/][^\/][^\/]+))\/\.\.\//, '');

			return r;
		}

		/**
		 * Resolve relative module ids
		 */
		public resolveModule(moduleId: string): string {
			let result = moduleId;

			if (!Utilities.isAbsolutePath(result)) {
				if (Utilities.startsWith(result, './') || Utilities.startsWith(result, '../')) {
					result = ModuleIdResolver._normalizeModuleId(this.fromModulePath + result);
				}
			}

			return result;
		}
	}

	// ------------------------------------------------------------------------
	// Module
	export class Module {

		public readonly id: ModuleId;
		public readonly strId: string;
		public readonly dependencies: Dependency[] | null;

		private readonly _callback: any | null;
		private readonly _errorback: ((err: AnnotatedError) => void) | null | undefined;
		public readonly moduleIdResolver: ModuleIdResolver | null;

		public exports: any;
		public error: AnnotatedError | null;
		public exportsPassedIn: boolean;
		public unresolvedDependenciesCount: number;
		private _isComplete: boolean;

		constructor(
			id: ModuleId,
			strId: string,
			dependencies: Dependency[],
			callback: any,
			errorback: ((err: AnnotatedError) => void) | null | undefined,
			moduleIdResolver: ModuleIdResolver | null,
		) {
			this.id = id;
			this.strId = strId;
			this.dependencies = dependencies;
			this._callback = callback;
			this._errorback = errorback;
			this.moduleIdResolver = moduleIdResolver;
			this.exports = {};
			this.error = null;
			this.exportsPassedIn = false;
			this.unresolvedDependenciesCount = this.dependencies.length;
			this._isComplete = false;
		}

		private static _safeInvokeFunction(callback: Function, args: any[]): { returnedValue: any; producedError: any; } {
			try {
				return {
					returnedValue: callback.apply(global, args),
					producedError: null
				};
			} catch (e) {
				return {
					returnedValue: null,
					producedError: e
				};
			}
		}

		private static _invokeFactory(config: Configuration, strModuleId: string, callback: Function, dependenciesValues: any[]): { returnedValue: any; producedError: any; } {
			if (config.isBuild() && !Utilities.isAnonymousModule(strModuleId)) {
				return {
					returnedValue: null,
					producedError: null
				};
			}

			if (config.shouldCatchError()) {
				return this._safeInvokeFunction(callback, dependenciesValues);
			}

			return {
				returnedValue: callback.apply(global, dependenciesValues),
				producedError: null
			};
		}

		public complete(recorder: ILoaderEventRecorder, config: Configuration, dependenciesValues: any[]): void {
			this._isComplete = true;

			let producedError: any = null;
			if (this._callback) {
				if (typeof this._callback === 'function') {

					recorder.record(LoaderEventType.BeginInvokeFactory, this.strId);
					let r = Module._invokeFactory(config, this.strId, this._callback, dependenciesValues);
					producedError = r.producedError;
					recorder.record(LoaderEventType.EndInvokeFactory, this.strId);

					if (!producedError && typeof r.returnedValue !== 'undefined' && (!this.exportsPassedIn || Utilities.isEmpty(this.exports))) {
						this.exports = r.returnedValue;
					}

				} else {
					this.exports = this._callback;
				}
			}

			if (producedError) {
				let err = ensureError<AnnotatedFactoryError>(producedError);
				err.phase = 'factory';
				err.moduleId = this.strId;
				this.error = err;
				config.onError(err);
			}

			(<any>this).dependencies = null;
			(<any>this)._callback = null;
			(<any>this)._errorback = null;
			(<any>this).moduleIdResolver = null;
		}

		/**
		 * One of the direct dependencies or a transitive dependency has failed to load.
		 */
		public onDependencyError(err: AnnotatedError): boolean {
			this._isComplete = true;
			this.error = err;
			if (this._errorback) {
				this._errorback(err);
				return true;
			}
			return false;
		}

		/**
		 * Is the current module complete?
		 */
		public isComplete(): boolean {
			return this._isComplete;
		}
	}

	// ------------------------------------------------------------------------
	// ModuleManager

	export interface IPosition {
		line: number;
		col: number;
	}

	export interface IBuildModuleInfo {
		id: string;
		path: string | null;
		defineLocation: IPosition | null;
		dependencies: string[];
		shim: string | null;
		exports: any;
	}

	export const enum ModuleId {
		EXPORTS = 0,
		MODULE = 1,
		REQUIRE = 2
	}

	class ModuleIdProvider {
		private _nextId: number;
		private _strModuleIdToIntModuleId: Map<string, ModuleId>;
		private _intModuleIdToStrModuleId: string[];

		constructor() {
			this._nextId = 0;
			this._strModuleIdToIntModuleId = new Map<string, ModuleId>();
			this._intModuleIdToStrModuleId = [];

			// Ensure values 0, 1, 2 are assigned accordingly with ModuleId
			this.getModuleId('exports');
			this.getModuleId('module');
			this.getModuleId('require');
		}

		public getMaxModuleId(): number {
			return this._nextId;
		}

		public getModuleId(strModuleId: string): ModuleId {
			let id = this._strModuleIdToIntModuleId.get(strModuleId);
			if (typeof id === 'undefined') {
				id = this._nextId++;
				this._strModuleIdToIntModuleId.set(strModuleId, id);
				this._intModuleIdToStrModuleId[id] = strModuleId;
			}
			return id;
		}

		public getStrModuleId(moduleId: ModuleId): string {
			return this._intModuleIdToStrModuleId[moduleId];
		}
	}

	export class RegularDependency {
		public static EXPORTS = new RegularDependency(ModuleId.EXPORTS);
		public static MODULE = new RegularDependency(ModuleId.MODULE);
		public static REQUIRE = new RegularDependency(ModuleId.REQUIRE);

		public readonly id: ModuleId;

		constructor(id: ModuleId) {
			this.id = id;
		}
	}

	export class PluginDependency {
		public readonly id: ModuleId;
		public readonly pluginId: ModuleId;
		public readonly pluginParam: string;

		constructor(id: ModuleId, pluginId: ModuleId, pluginParam: string) {
			this.id = id;
			this.pluginId = pluginId;
			this.pluginParam = pluginParam;
		}
	}

	export type Dependency = RegularDependency | PluginDependency;

	export class ModuleManager {

		private readonly _env: Environment;
		private readonly _scriptLoader: IScriptLoader;
		private readonly _loaderAvailableTimestamp: number;
		private readonly _defineFunc: IDefineFunc;
		private readonly _requireFunc: IRequireFunc;

		private _moduleIdProvider: ModuleIdProvider;
		private _config: Configuration;
		private _hasDependencyCycle: boolean;

		/**
		 * map of module id => module.
		 * If a module is found in _modules, its code has been loaded, but
		 * not necessary all its dependencies have been resolved
		 */
		private _modules2: Module[];

		/**
		 * Set of module ids => true
		 * If a module is found in _knownModules, a call has been made
		 * to the scriptLoader to load its code or a call will be made
		 * This is mainly used as a flag to not try loading the same module twice
		 */
		private _knownModules2: boolean[];

		/**
		 * map of module id => array [module id]
		 */
		private _inverseDependencies2: (ModuleId[] | null)[];

		/**
		 * Hash map of module id => array [ { moduleId, pluginParam } ]
		 */
		private _inversePluginDependencies2: Map<ModuleId, PluginDependency[]>;

		/**
		 * current annonymous received define call, but not yet processed
		 */
		private _currentAnnonymousDefineCall: IDefineCall | null;

		private _recorder: ILoaderEventRecorder | null;

		private _buildInfoPath: string[];
		private _buildInfoDefineStack: (string | null)[];
		private _buildInfoDependencies: string[][];

		constructor(env: Environment, scriptLoader: IScriptLoader, defineFunc: IDefineFunc, requireFunc: IRequireFunc, loaderAvailableTimestamp: number = 0) {
			this._env = env;
			this._scriptLoader = scriptLoader;
			this._loaderAvailableTimestamp = loaderAvailableTimestamp;
			this._defineFunc = defineFunc;
			this._requireFunc = requireFunc;
			this._moduleIdProvider = new ModuleIdProvider();
			this._config = new Configuration(this._env);
			this._hasDependencyCycle = false;
			this._modules2 = [];
			this._knownModules2 = [];
			this._inverseDependencies2 = [];
			this._inversePluginDependencies2 = new Map<ModuleId, PluginDependency[]>();
			this._currentAnnonymousDefineCall = null;

			this._recorder = null;
			this._buildInfoPath = [];
			this._buildInfoDefineStack = [];
			this._buildInfoDependencies = [];
		}

		public reset(): ModuleManager {
			return new ModuleManager(this._env, this._scriptLoader, this._defineFunc, this._requireFunc, this._loaderAvailableTimestamp);
		}

		public getGlobalAMDDefineFunc(): IDefineFunc {
			return this._defineFunc;
		}

		public getGlobalAMDRequireFunc(): IRequireFunc {
			return this._requireFunc;
		}

		private static _findRelevantLocationInStack(needle: string, stack: string): IPosition {
			let normalize = (str: string) => str.replace(/\\/g, '/');
			let normalizedPath = normalize(needle);

			let stackPieces = stack.split(/\n/);
			for (let i = 0; i < stackPieces.length; i++) {
				let m = stackPieces[i].match(/(.*):(\d+):(\d+)\)?$/);
				if (m) {
					let stackPath = m[1];
					let stackLine = m[2];
					let stackColumn = m[3];

					let trimPathOffset = Math.max(
						stackPath.lastIndexOf(' ') + 1,
						stackPath.lastIndexOf('(') + 1
					);

					stackPath = stackPath.substr(trimPathOffset);
					stackPath = normalize(stackPath);

					if (stackPath === normalizedPath) {
						let r = {
							line: parseInt(stackLine, 10),
							col: parseInt(stackColumn, 10)
						};
						if (r.line === 1) {
							r.col -= '(function (require, define, __filename, __dirname) { '.length;
						}
						return r;
					}
				}
			}

			throw new Error('Could not correlate define call site for needle ' + needle);
		}

		public getBuildInfo(): IBuildModuleInfo[] | null {
			if (!this._config.isBuild()) {
				return null;
			}

			let result: IBuildModuleInfo[] = [], resultLen = 0;
			for (let i = 0, len = this._modules2.length; i < len; i++) {
				let m = this._modules2[i];
				if (!m) {
					continue;
				}

				let location = this._buildInfoPath[m.id] || null;
				let defineStack = this._buildInfoDefineStack[m.id] || null;
				let dependencies = this._buildInfoDependencies[m.id];
				result[resultLen++] = {
					id: m.strId,
					path: location,
					defineLocation: (location && defineStack ? ModuleManager._findRelevantLocationInStack(location, defineStack) : null),
					dependencies: dependencies,
					shim: null,
					exports: m.exports
				};
			}
			return result;
		}

		public getRecorder(): ILoaderEventRecorder {
			if (!this._recorder) {
				if (this._config.shouldRecordStats()) {
					this._recorder = new LoaderEventRecorder(this._loaderAvailableTimestamp);
				} else {
					this._recorder = NullLoaderEventRecorder.INSTANCE;
				}
			}
			return this._recorder;
		}

		public getLoaderEvents(): LoaderEvent[] {
			return this.getRecorder().getEvents();
		}

		/**
		 * Defines an anonymous module (without an id). Its name will be resolved as we receive a callback from the scriptLoader.
		 * @param dependecies @see defineModule
		 * @param callback @see defineModule
		 */
		public enqueueDefineAnonymousModule(dependencies: string[], callback: any): void {
			if (this._currentAnnonymousDefineCall !== null) {
				throw new Error('Can only have one anonymous define call per script file');
			}
			let stack: string | null = null;
			if (this._config.isBuild()) {
				stack = new Error('StackLocation').stack || null;
			}
			this._currentAnnonymousDefineCall = {
				stack: stack,
				dependencies: dependencies,
				callback: callback
			};
		}

		/**
		 * Creates a module and stores it in _modules. The manager will immediately begin resolving its dependencies.
		 * @param strModuleId An unique and absolute id of the module. This must not collide with another module's id
		 * @param dependencies An array with the dependencies of the module. Special keys are: "require", "exports" and "module"
		 * @param callback if callback is a function, it will be called with the resolved dependencies. if callback is an object, it will be considered as the exports of the module.
		 */
		public defineModule(strModuleId: string, dependencies: string[], callback: any, errorback: ((err: AnnotatedError) => void) | null | undefined, stack: string | null, moduleIdResolver: ModuleIdResolver = new ModuleIdResolver(strModuleId)): void {
			let moduleId = this._moduleIdProvider.getModuleId(strModuleId);
			if (this._modules2[moduleId]) {
				if (!this._config.isDuplicateMessageIgnoredFor(strModuleId)) {
					console.warn('Duplicate definition of module \'' + strModuleId + '\'');
				}
				// Super important! Completely ignore duplicate module definition
				return;
			}

			let m = new Module(moduleId, strModuleId, this._normalizeDependencies(dependencies, moduleIdResolver), callback, errorback, moduleIdResolver);
			this._modules2[moduleId] = m;

			if (this._config.isBuild()) {
				this._buildInfoDefineStack[moduleId] = stack;
				this._buildInfoDependencies[moduleId] = (m.dependencies || []).map(dep => this._moduleIdProvider.getStrModuleId(dep.id));
			}

			// Resolving of dependencies is immediate (not in a timeout). If there's a need to support a packer that concatenates in an
			// unordered manner, in order to finish processing the file, execute the following method in a timeout
			this._resolve(m);
		}

		private _normalizeDependency(dependency: string, moduleIdResolver: ModuleIdResolver): Dependency {
			if (dependency === 'exports') {
				return RegularDependency.EXPORTS;
			}
			if (dependency === 'module') {
				return RegularDependency.MODULE;
			}
			if (dependency === 'require') {
				return RegularDependency.REQUIRE;
			}
			// Normalize dependency and then request it from the manager
			let bangIndex = dependency.indexOf('!');

			if (bangIndex >= 0) {
				let strPluginId = moduleIdResolver.resolveModule(dependency.substr(0, bangIndex));
				let pluginParam = moduleIdResolver.resolveModule(dependency.substr(bangIndex + 1));
				let dependencyId = this._moduleIdProvider.getModuleId(strPluginId + '!' + pluginParam);
				let pluginId = this._moduleIdProvider.getModuleId(strPluginId);
				return new PluginDependency(dependencyId, pluginId, pluginParam);
			}

			return new RegularDependency(this._moduleIdProvider.getModuleId(moduleIdResolver.resolveModule(dependency)));
		}

		private _normalizeDependencies(dependencies: string[], moduleIdResolver: ModuleIdResolver): Dependency[] {
			let result: Dependency[] = [], resultLen = 0;
			for (let i = 0, len = dependencies.length; i < len; i++) {
				result[resultLen++] = this._normalizeDependency(dependencies[i], moduleIdResolver);
			}
			return result;
		}

		private _relativeRequire(moduleIdResolver: ModuleIdResolver, dependencies: string | string[], callback?: Function, errorback?: ((err: AnnotatedError) => void)): any {
			if (typeof dependencies === 'string') {
				return this.synchronousRequire(dependencies, moduleIdResolver);
			}

			this.defineModule(Utilities.generateAnonymousModule(), dependencies, callback, errorback, null, moduleIdResolver);
		}

		/**
		 * Require synchronously a module by its absolute id. If the module is not loaded, an exception will be thrown.
		 * @param id The unique and absolute id of the required module
		 * @return The exports of module 'id'
		 */
		public synchronousRequire(_strModuleId: string, moduleIdResolver: ModuleIdResolver = new ModuleIdResolver(_strModuleId)): any {
			let dependency = this._normalizeDependency(_strModuleId, moduleIdResolver);
			let m = this._modules2[dependency.id];

			if (!m) {
				throw new Error('Check dependency list! Synchronous require cannot resolve module \'' + _strModuleId + '\'. This is the first mention of this module!');
			}
			if (!m.isComplete()) {
				throw new Error('Check dependency list! Synchronous require cannot resolve module \'' + _strModuleId + '\'. This module has not been resolved completely yet.');
			}
			if (m.error) {
				throw m.error;
			}
			return m.exports;
		}

		public configure(params: IConfigurationOptions, shouldOverwrite: boolean): void {
			let oldShouldRecordStats = this._config.shouldRecordStats();
			if (shouldOverwrite) {
				this._config = new Configuration(this._env, params);
			} else {
				this._config = this._config.cloneAndMerge(params);
			}
			if (this._config.shouldRecordStats() && !oldShouldRecordStats) {
				this._recorder = null;
			}
		}

		public getConfig(): Configuration {
			return this._config;
		}

		/**
		 * Callback from the scriptLoader when a module has been loaded.
		 * This means its code is available and has been executed.
		 */
		private _onLoad(moduleId: ModuleId): void {
			if (this._currentAnnonymousDefineCall !== null) {
				let defineCall = this._currentAnnonymousDefineCall;
				this._currentAnnonymousDefineCall = null;

				// Hit an anonymous define call
				this.defineModule(this._moduleIdProvider.getStrModuleId(moduleId), defineCall.dependencies, defineCall.callback, null, defineCall.stack);
			}
		}

		private _createLoadError(moduleId: ModuleId, _err: any): AnnotatedError {
			let strModuleId = this._moduleIdProvider.getStrModuleId(moduleId);
			let neededBy = (this._inverseDependencies2[moduleId] || []).map((intModuleId) => this._moduleIdProvider.getStrModuleId(intModuleId));

			const err = ensureError<AnnotatedLoadingError>(_err);
			err.phase = 'loading';
			err.moduleId = strModuleId;
			err.neededBy = neededBy;

			return err;
		}

		/**
		 * Callback from the scriptLoader when a module hasn't been loaded.
		 * This means that the script was not found (e.g. 404) or there was an error in the script.
		 */
		private _onLoadError(moduleId: ModuleId, err: any): void {
			const error = this._createLoadError(moduleId, err);
			if (!this._modules2[moduleId]) {
				this._modules2[moduleId] = new Module(moduleId, this._moduleIdProvider.getStrModuleId(moduleId), [], () => { }, () => { }, null);
			}

			// Find any 'local' error handlers, walk the entire chain of inverse dependencies if necessary.
			let seenModuleId: boolean[] = [];
			for (let i = 0, len = this._moduleIdProvider.getMaxModuleId(); i < len; i++) {
				seenModuleId[i] = false;
			}
			let someoneNotified = false;
			let queue: ModuleId[] = [];

			queue.push(moduleId);
			seenModuleId[moduleId] = true;

			while (queue.length > 0) {
				let queueElement = queue.shift()!;
				let m = this._modules2[queueElement];
				if (m) {
					someoneNotified = m.onDependencyError(error) || someoneNotified;
				}

				let inverseDeps = this._inverseDependencies2[queueElement];
				if (inverseDeps) {
					for (let i = 0, len = inverseDeps.length; i < len; i++) {
						let inverseDep = inverseDeps[i];
						if (!seenModuleId[inverseDep]) {
							queue.push(inverseDep);
							seenModuleId[inverseDep] = true;
						}
					}
				}
			}

			if (!someoneNotified) {
				this._config.onError(error);
			}
		}

		/**
		 * Walks (recursively) the dependencies of 'from' in search of 'to'.
		 * Returns true if there is such a path or false otherwise.
		 * @param from Module id to start at
		 * @param to Module id to look for
		 */
		private _hasDependencyPath(fromId: ModuleId, toId: ModuleId): boolean {
			let from = this._modules2[fromId];
			if (!from) {
				return false;
			}

			let inQueue: boolean[] = [];
			for (let i = 0, len = this._moduleIdProvider.getMaxModuleId(); i < len; i++) {
				inQueue[i] = false;
			}
			let queue: Module[] = [];

			// Insert 'from' in queue
			queue.push(from);
			inQueue[fromId] = true;

			while (queue.length > 0) {
				// Pop first inserted element of queue
				let element = queue.shift()!;
				let dependencies = element.dependencies;
				if (dependencies) {
					// Walk the element's dependencies
					for (let i = 0, len = dependencies.length; i < len; i++) {
						let dependency = dependencies[i];

						if (dependency.id === toId) {
							// There is a path to 'to'
							return true;
						}

						let dependencyModule = this._modules2[dependency.id];
						if (dependencyModule && !inQueue[dependency.id]) {
							// Insert 'dependency' in queue
							inQueue[dependency.id] = true;
							queue.push(dependencyModule);
						}
					}
				}
			}

			// There is no path to 'to'
			return false;
		}

		/**
		 * Walks (recursively) the dependencies of 'from' in search of 'to'.
		 * Returns cycle as array.
		 * @param from Module id to start at
		 * @param to Module id to look for
		 */
		private _findCyclePath(fromId: ModuleId, toId: ModuleId, depth: number): (ModuleId[] | null) {
			if (fromId === toId || depth === 50) {
				return [fromId];
			}

			let from = this._modules2[fromId];
			if (!from) {
				return null;
			}

			// Walk the element's dependencies
			let dependencies = from.dependencies;
			if (dependencies) {
				for (let i = 0, len = dependencies.length; i < len; i++) {
					let path = this._findCyclePath(dependencies[i].id, toId, depth + 1);
					if (path !== null) {
						path.push(fromId);
						return path;
					}
				}
			}

			return null;
		}

		/**
		 * Create the local 'require' that is passed into modules
		 */
		private _createRequire(moduleIdResolver: ModuleIdResolver): IRelativeRequire {
			let result: IRelativeRequire = <any>((dependencies: any, callback?: Function, errorback?: ((err: AnnotatedError) => void)) => {
				return this._relativeRequire(moduleIdResolver, dependencies, callback, errorback);
			});
			result.toUrl = (id: string) => {
				return this._config.requireToUrl(moduleIdResolver.resolveModule(id));
			};
			result.getStats = () => {
				return this.getLoaderEvents();
			};
			result.hasDependencyCycle = () => {
				return this._hasDependencyCycle;
			};
			result.config = (params: IConfigurationOptions, shouldOverwrite: boolean = false) => {
				this.configure(params, shouldOverwrite);
			};
			(<any>result).__$__nodeRequire = global.nodeRequire;
			return result;
		}

		private _loadModule(moduleId: ModuleId): void {
			if (this._modules2[moduleId] || this._knownModules2[moduleId]) {
				// known module
				return;
			}
			this._knownModules2[moduleId] = true;

			let strModuleId = this._moduleIdProvider.getStrModuleId(moduleId);
			let paths = this._config.moduleIdToPaths(strModuleId);

			let scopedPackageRegex = /^@[^\/]+\/[^\/]+$/ // matches @scope/package-name
			if (this._env.isNode && (strModuleId.indexOf('/') === -1 || scopedPackageRegex.test(strModuleId))) {
				paths.push('node|' + strModuleId);
			}

			let lastPathIndex = -1;
			let loadNextPath = (err: any) => {
				lastPathIndex++;

				if (lastPathIndex >= paths.length) {
					// No more paths to try
					this._onLoadError(moduleId, err);
				} else {
					let currentPath = paths[lastPathIndex];
					let recorder = this.getRecorder();

					if (this._config.isBuild() && currentPath === 'empty:') {
						this._buildInfoPath[moduleId] = currentPath;
						this.defineModule(this._moduleIdProvider.getStrModuleId(moduleId), [], null, null, null);
						this._onLoad(moduleId);
						return;
					}

					recorder.record(LoaderEventType.BeginLoadingScript, currentPath);
					this._scriptLoader.load(this, currentPath, () => {
						if (this._config.isBuild()) {
							this._buildInfoPath[moduleId] = currentPath;
						}
						recorder.record(LoaderEventType.EndLoadingScriptOK, currentPath);
						this._onLoad(moduleId);
					}, (err) => {
						recorder.record(LoaderEventType.EndLoadingScriptError, currentPath);
						loadNextPath(err);
					});
				}
			};

			loadNextPath(null);
		}

		/**
		 * Resolve a plugin dependency with the plugin loaded & complete
		 * @param module The module that has this dependency
		 * @param pluginDependency The semi-normalized dependency that appears in the module. e.g. 'bg/css!./mycssfile'. Only the plugin part (before !) is normalized
		 * @param plugin The plugin (what the plugin exports)
		 */
		private _loadPluginDependency(plugin: ILoaderPlugin, pluginDependency: PluginDependency): void {
			if (this._modules2[pluginDependency.id] || this._knownModules2[pluginDependency.id]) {
				// known module
				return;
			}
			this._knownModules2[pluginDependency.id] = true;

			// Delegate the loading of the resource to the plugin
			let load: IPluginLoadCallback = <any>((value: any) => {
				this.defineModule(this._moduleIdProvider.getStrModuleId(pluginDependency.id), [], value, null, null);
			});
			load.error = (err: any) => {
				this._config.onError(this._createLoadError(pluginDependency.id, err));
			};

			plugin.load(pluginDependency.pluginParam, this._createRequire(ModuleIdResolver.ROOT), load, this._config.getOptionsLiteral());
		}

		/**
		 * Examine the dependencies of module 'module' and resolve them as needed.
		 */
		private _resolve(module: Module): void {
			let dependencies = module.dependencies;
			if (dependencies) {
				for (let i = 0, len = dependencies.length; i < len; i++) {
					let dependency = dependencies[i];

					if (dependency === RegularDependency.EXPORTS) {
						module.exportsPassedIn = true;
						module.unresolvedDependenciesCount--;
						continue;
					}

					if (dependency === RegularDependency.MODULE) {
						module.unresolvedDependenciesCount--;
						continue;
					}

					if (dependency === RegularDependency.REQUIRE) {
						module.unresolvedDependenciesCount--;
						continue;
					}

					let dependencyModule = this._modules2[dependency.id];
					if (dependencyModule && dependencyModule.isComplete()) {
						if (dependencyModule.error) {
							module.onDependencyError(dependencyModule.error);
							return;
						}
						module.unresolvedDependenciesCount--;
						continue;
					}

					if (this._hasDependencyPath(dependency.id, module.id)) {
						this._hasDependencyCycle = true;
						console.warn('There is a dependency cycle between \'' + this._moduleIdProvider.getStrModuleId(dependency.id) + '\' and \'' + this._moduleIdProvider.getStrModuleId(module.id) + '\'. The cyclic path follows:');
						let cyclePath = this._findCyclePath(dependency.id, module.id, 0) || [];
						cyclePath.reverse();
						cyclePath.push(dependency.id);
						console.warn(cyclePath.map(id => this._moduleIdProvider.getStrModuleId(id)).join(' => \n'));

						// Break the cycle
						module.unresolvedDependenciesCount--;
						continue;
					}

					// record inverse dependency
					this._inverseDependencies2[dependency.id] = this._inverseDependencies2[dependency.id] || [];
					this._inverseDependencies2[dependency.id]!.push(module.id);

					if (dependency instanceof PluginDependency) {
						let plugin = this._modules2[dependency.pluginId];
						if (plugin && plugin.isComplete()) {
							this._loadPluginDependency(plugin.exports, dependency);
							continue;
						}

						// Record dependency for when the plugin gets loaded
						let inversePluginDeps: PluginDependency[] | undefined = this._inversePluginDependencies2.get(dependency.pluginId);
						if (!inversePluginDeps) {
							inversePluginDeps = [];
							this._inversePluginDependencies2.set(dependency.pluginId, inversePluginDeps);
						}

						inversePluginDeps.push(dependency);

						this._loadModule(dependency.pluginId);
						continue;
					}

					this._loadModule(dependency.id);
				}
			}

			if (module.unresolvedDependenciesCount === 0) {
				this._onModuleComplete(module);
			}
		}

		private _onModuleComplete(module: Module): void {
			let recorder = this.getRecorder();

			if (module.isComplete()) {
				// already done
				return;
			}

			let dependencies = module.dependencies;
			let dependenciesValues: any[] = [];
			if (dependencies) {
				for (let i = 0, len = dependencies.length; i < len; i++) {
					let dependency = dependencies[i];

					if (dependency === RegularDependency.EXPORTS) {
						dependenciesValues[i] = module.exports;
						continue;
					}

					if (dependency === RegularDependency.MODULE) {
						dependenciesValues[i] = {
							id: module.strId,
							config: () => {
								return this._config.getConfigForModule(module.strId);
							}
						};
						continue;
					}

					if (dependency === RegularDependency.REQUIRE) {
						dependenciesValues[i] = this._createRequire(module.moduleIdResolver!);
						continue;
					}

					let dependencyModule = this._modules2[dependency.id];
					if (dependencyModule) {
						dependenciesValues[i] = dependencyModule.exports;
						continue;
					}

					dependenciesValues[i] = null;
				}
			}

			module.complete(recorder, this._config, dependenciesValues);

			// Fetch and clear inverse dependencies
			let inverseDeps = this._inverseDependencies2[module.id];
			this._inverseDependencies2[module.id] = null;

			if (inverseDeps) {
				// Resolve one inverse dependency at a time, always
				// on the lookout for a completed module.
				for (let i = 0, len = inverseDeps.length; i < len; i++) {
					let inverseDependencyId = inverseDeps[i];
					let inverseDependency = this._modules2[inverseDependencyId];
					inverseDependency.unresolvedDependenciesCount--;
					if (inverseDependency.unresolvedDependenciesCount === 0) {
						this._onModuleComplete(inverseDependency);
					}
				}
			}

			let inversePluginDeps = this._inversePluginDependencies2.get(module.id);
			if (inversePluginDeps) {
				// This module is used as a plugin at least once
				// Fetch and clear these inverse plugin dependencies
				this._inversePluginDependencies2.delete(module.id);

				// Resolve plugin dependencies one at a time
				for (let i = 0, len = inversePluginDeps.length; i < len; i++) {
					this._loadPluginDependency(module.exports, inversePluginDeps[i]);
				}
			}
		}
	}
	//#endregion
	//#region main

	const env = new Environment();

	let moduleManager: ModuleManager = null!;

	const DefineFunc: IDefineFunc = <any>function (id: any, dependencies: any, callback: any): void {
		if (typeof id !== 'string') {
			callback = dependencies;
			dependencies = id;
			id = null;
		}
		if (typeof dependencies !== 'object' || !Array.isArray(dependencies)) {
			callback = dependencies;
			dependencies = null;
		}
		if (!dependencies) {
			dependencies = ['require', 'exports', 'module'];
		}

		if (id) {
			moduleManager.defineModule(id, dependencies, callback, null, null);
		} else {
			moduleManager.enqueueDefineAnonymousModule(dependencies, callback);
		}
	};
	DefineFunc.amd = {
		jQuery: true
	};

	const _requireFunc_config = function (params: IConfigurationOptions, shouldOverwrite: boolean = false): void {
		moduleManager.configure(params, shouldOverwrite);
	};
	const RequireFunc: IRequireFunc = <any>function () {
		if (arguments.length === 1) {
			if ((arguments[0] instanceof Object) && !Array.isArray(arguments[0])) {
				_requireFunc_config(arguments[0]);
				return;
			}
			if (typeof arguments[0] === 'string') {
				return moduleManager.synchronousRequire(arguments[0]);
			}
		}
		if (arguments.length === 2 || arguments.length === 3) {
			if (Array.isArray(arguments[0])) {
				moduleManager.defineModule(Utilities.generateAnonymousModule(), arguments[0], arguments[1], arguments[2], null);
				return;
			}
		}
		throw new Error('Unrecognized require call');
	};
	RequireFunc.config = _requireFunc_config;
	RequireFunc.getConfig = function (): IConfigurationOptions {
		return moduleManager.getConfig().getOptionsLiteral();
	};
	RequireFunc.reset = function (): void {
		moduleManager = moduleManager.reset();
	};
	RequireFunc.getBuildInfo = function (): IBuildModuleInfo[] | null {
		return moduleManager.getBuildInfo();
	};
	RequireFunc.getStats = function (): LoaderEvent[] {
		return moduleManager.getLoaderEvents();
	};
	RequireFunc.define = function () {
		return DefineFunc.apply(null, arguments as any);
	}

	export function init(): void {
		if (typeof global.require !== 'undefined' || typeof require !== 'undefined') {
			const _nodeRequire = (global.require || require);
			if (typeof _nodeRequire === 'function' && typeof _nodeRequire.resolve === 'function') {
				// re-expose node's require function
				const nodeRequire = ensureRecordedNodeRequire(moduleManager.getRecorder(), _nodeRequire);
				global.nodeRequire = nodeRequire;
				(<any>RequireFunc).nodeRequire = nodeRequire;
				(<any>RequireFunc).__$__nodeRequire = nodeRequire;
			}
		}

		if (env.isNode && !env.isElectronRenderer) {
			module.exports = RequireFunc;
			require = <any>RequireFunc;
		} else {
			if (!env.isElectronRenderer) {
				global.define = DefineFunc;
			}
			global.require = RequireFunc;
		}
	}

	if (typeof global.define !== 'function' || !global.define.amd) {
		moduleManager = new ModuleManager(env, createScriptLoader(env), DefineFunc, RequireFunc, Utilities.getHighPerformanceTimestamp());

		// The global variable require can configure the loader
		if (typeof global.require !== 'undefined' && typeof global.require !== 'function') {
			RequireFunc.config(global.require);
		}

		// This define is for the local closure defined in node in the case that the loader is concatenated
		//@ts-ignore
		define = function () {
			return DefineFunc.apply(null, arguments as any);
		};
		define.amd = DefineFunc.amd;

		if (typeof doNotInitLoader === 'undefined') {
			init();
		}
	}
	//#endregion
}
