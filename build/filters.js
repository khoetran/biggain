/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

/**
 * Hygiene works by creating cascading subsets of all our files and
 * passing them through a sequence of checks. Here are the current subsets,
 * named according to the checks performed on them. Each subset contains
 * the following one, as described in mathematical notation:
 *
 * all ⊃ eol ⊇ indentation ⊃ copyright ⊃ typescript
 */

module.exports.all = [
	'*',
	'build/**/*',
	'scripts/**/*',
	'src/**/*',
	'test/**/*',
	'!out*/**',
	'!test/**/out/**',
	'!**/node_modules/**',
];

module.exports.indentationFilter = [
	'**',

	// except specific files
	'!**/LICENSE.{txt,rtf}',
	'!LICENSES.chromium.html',
	'!**/LICENSE',
	'!test/unit/assert.js',

	// except multiple specific files
	'!**/package.json',
	'!**/yarn.lock',
	'!**/yarn-error.log',

	// except specific file types
	'!src/bg/*/**/*.d.ts',
	'!src/typings/**/*.d.ts',
	'!**/*.{svg,exe,png,bmp,jpg,scpt,bat,cmd,cur,ttf,woff,eot,md,ps1,template,yaml,yml,d.ts.recipe,ico,icns,plist}',
	'!build/lib/**/*.js',
];

module.exports.copyrightFilter = [
	'**',
	'!**/*.desktop',
	'!**/*.json',
	'!**/*.html',
	'!**/*.template',
	'!**/*.md',
	'!**/*.bat',
	'!**/*.cmd',
	'!**/*.ico',
	'!**/*.icns',
	'!**/*.xml',
	'!**/*.sh',
	'!**/*.txt',
	'!**/*.xpm',
	'!**/*.opts',
	'!**/*.disabled',
	'!**/*.code-workspace',
	'!**/*.js.map',
	'!resources/win32/bin/biggain.js',
	'!resources/web/biggain-web.js'
];

module.exports.jsHygieneFilter = [
	'src/**/*.js',
	'build/gulpfile.*.js',
	'!**/test/**',
];

module.exports.tsHygieneFilter = [
	'src/**/*.ts',
	'test/**/*.ts',
	'!src/bg/*/**/*.d.ts',
	'!src/typings/**/*.d.ts',
	'!**/node_modules/**',
];
