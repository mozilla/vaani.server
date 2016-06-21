/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

var clients = [],
    count = 0;

module.exports = {

    serve: (port) => {
        var wss = new WebSocketServer({
            port: port
        });
        wss.on('connection', (ws) => {
            console.log('Connecting a client...');

            var id = count++,
                buffer = [],
                ttt;
            clients[id] = ws;
            ws.on('message', (data, flags) => {
                console.log('From client - type: ' + typeof(data) + ' length: ' + data.length);
                buffer.push(data);
            });
            ws.on('close', () => {
                delete clients[id];
                clearInterval(interval);
                console.log('Client disconnected.');
            });

            var kaldi = new WebSocket('ws://52.37.26.79:8888/client/ws/speech?content-type=audio/x-raw,layout=(string)interleaved,rate=(int)16000,format=(string)S16LE,channels=(int)1');
            kaldi.on('open', () => {
                console.time('kaldi');
                console.log('connected with kaldi - starting time measurement');

                var send = () => {
                    var i;
                    for(i = 0; i<buffer.length; i++) {
                        kaldi.send(buffer[i]);
                        console.log ('sent one package to kaldi');
                    }
                    buffer = [];
                };
                send();
                var interval = setInterval(send, 250);
            });
            kaldi.on('message', (data, flags) => {
                console.log ('received one package from kaldi');
                var message = JSON.parse(data);
                if (message.status > 0) {
                    console.timeEnd('kaldi');
                    ws.send(JSON.stringify({ status: message.status, message: 'Speech recognition failed', data: message }));
                    return;
                }
                var result = message.result;
                if (result && result.final) {
                    console.timeEnd('kaldi');
                    ws.send(JSON.stringify({ status: message.status, message: 'OK', data: result.hypotheses[0].transcript }));
                }
            });
        });
    }
};
