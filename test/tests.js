/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const vaani = require('../index');
const WebSocket = require('ws');
const fs = require('fs');

vaani.serve(8080);
var ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => {
    fs.readFile('test/resources/helloworld.raw', (err, data) => {
        if (err) throw err;
        ws.send(data);
        ws.send('EOS');
    });
});
ws.on('message', (data, flags) => {
    data = JSON.parse(data);
    console.log(data.data);
    process.exit(data.status);
});
