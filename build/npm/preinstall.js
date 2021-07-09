/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

let err = false;

const majorNodeVersion = parseInt(/^(\d+)\./.exec(process.versions.node)[1]);

if (majorNodeVersion < 14 || majorNodeVersion >= 17) {
	console.error('\033[1;31m*** Please use node.js versions >=14 and <=17.\033[0;0m');
	err = true;
}

const cp = require('child_process');
const yarnVersion = cp.execSync('yarn -v', { encoding: 'utf8' }).trim();
const parsedYarnVersion = /^(\d+)\.(\d+)\./.exec(yarnVersion);
const majorYarnVersion = parseInt(parsedYarnVersion[1]);
const minorYarnVersion = parseInt(parsedYarnVersion[2]);

if (majorYarnVersion < 1 || minorYarnVersion < 10) {
	console.error('\033[1;31m*** Please use yarn >=1.10.1.\033[0;0m');
	err = true;
}

if (!/yarn[\w-.]*\.js$|yarnpkg$/.test(process.env['npm_execpath'])) {
	console.error('\033[1;31m*** Please use yarn to install dependencies.\033[0;0m');
	err = true;
}

if (err) {
	console.error('');
	process.exit(1);
}
