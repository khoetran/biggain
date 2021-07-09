/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// Increase max listeners for event emitters
require('events').EventEmitter.defaultMaxListeners = 100;

const gulp = require('gulp');
const util = require('./build/lib/util');
const task = require('./build/lib/task');
const compilation = require('./build/lib/compilation');
const { hygiene } = require('./build/hygiene');

const compileTask = task.define('compile', task.series(util.rimraf('out'), compilation.compileTask('src', 'out', false)));
gulp.task(compileTask);

const hygieneTask = task.define('hygiene', () => hygiene(undefined, false));
gulp.task(hygieneTask);

// Default
gulp.task('default', compileTask);

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
	process.exit(1);
});

