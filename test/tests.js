/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const vaani = require('../index');
const WebSocket = require('ws');

vaani.serve(8080);
var ws = new WebSocket('ws://localhost:8080');
ws.on('open', function() {
    ws.send('<A test message from the client>');
});
ws.on('message', function(data, flags) {
    console.log('From server: ' + data);
    process.exit();
});
