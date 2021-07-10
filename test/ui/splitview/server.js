/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Khoe Tran. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

const Koa = require('koa');
const _ = require('koa-route');
const serve = require('koa-static');
const mount = require('koa-mount');

const app = new Koa();

app.use(serve('public'));
app.use(mount('/static', serve('../../../out')));

app.listen(3000);
console.log('http://localhost:3000');
