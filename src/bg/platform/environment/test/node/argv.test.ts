/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { formatOptions, Option } from 'bg/platform/environment/node/argv';
import { addArg } from 'bg/platform/environment/node/argvHelper';

suite('formatOptions', () => {

	function o(description: string): Option<any> {
		return {
			description, type: 'string'
		};
	}

	test('Text should display small columns correctly', () => {
		assert.deepStrictEqual(
			formatOptions({
				'add': o('bar')
			}, 80),
			['  --add bar']
		);
		assert.deepStrictEqual(
			formatOptions({
				'add': o('bar'),
				'wait': o('ba'),
				'trace': o('b')
			}, 80),
			[
				'  --add   bar',
				'  --wait  ba',
				'  --trace b'
			]);
	});

	test('Text should wrap', () => {
		assert.deepStrictEqual(
			formatOptions({
				'add': o((<any>'bar ').repeat(9))
			}, 40),
			[
				'  --add bar bar bar bar bar bar bar bar',
				'        bar'
			]);
	});

	test('Text should revert to the condensed view when the terminal is too narrow', () => {
		assert.deepStrictEqual(
			formatOptions({
				'add': o((<any>'bar ').repeat(9))
			}, 30),
			[
				'  --add',
				'      bar bar bar bar bar bar bar bar bar '
			]);
	});

	test('addArg', () => {
		assert.deepStrictEqual(addArg([], 'foo'), ['foo']);
		assert.deepStrictEqual(addArg([], 'foo', 'bar'), ['foo', 'bar']);
		assert.deepStrictEqual(addArg(['foo'], 'bar'), ['foo', 'bar']);
		assert.deepStrictEqual(addArg(['--wait'], 'bar'), ['--wait', 'bar']);
		assert.deepStrictEqual(addArg(['--wait', '--', '--foo'], 'bar'), ['--wait', 'bar', '--', '--foo']);
		assert.deepStrictEqual(addArg(['--', '--foo'], 'bar'), ['bar', '--', '--foo']);
	});
});
