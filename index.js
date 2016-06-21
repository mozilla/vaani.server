/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
'use strict';

const http = require('http');
const WebSocketServer = require('ws').Server;

var clients = [],
    count = 0;

module.exports = {

    serve: function(port) {
        var wss = new WebSocketServer({
            port: port
        });
        wss.on('connection', function(ws) {
            console.log('Connecting a client...');
            var id = count++;
            clients[id] = ws;
            ws.on('message', function(data, flags) {
                console.log('From client: ' + data);
                ws.send('<A test message from the server>');
            });
            ws.on('close', function() {
                delete clients[id];
                console.log('Client disconnected.');
            });
        });
    }
};
