/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const fs = require('fs');
const url = require('url');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const watson = require('watson-developer-cloud');
const websocketStream = require('websocket-stream');

var clients = [],
    count = 0,

    getConfig = () => {
        var config = JSON.parse(process.env.VAANI_CONFIG || fs.readFileSync("config.json"));
        config.port = config.port || 80;
        return config;
    };

module.exports = {

    getConfig: getConfig,

    serve: (config) => {
        config = config || getConfig();

        var privateKey  = fs.readFileSync('key.pem', 'utf8');
        var certificate = fs.readFileSync('cert.pem', 'utf8');
        var credentials = {key: privateKey, cert: certificate};
        var httpsServer = https.createServer(credentials);
        httpsServer.listen(config.port);

        var wss = new WebSocketServer({
            server: httpsServer
        });
        var text_to_speech = watson.text_to_speech({
            username: config.watsontts.username,
            password: config.watsontts.password,
            version: 'v1'
        });
        wss.on('connection', (client) => {
            var id = count++,
                buffer = [],
                query = url.parse(client.upgradeReq.url, true).query,
                interval;

            clients[id] = client;

            client.on('message', (data, flags) => {
                buffer.push(data);
            });
            client.on('close', () => {
                delete clients[id];
                clearInterval(interval);
            });

            var answer = (message) => {
                console.log('Sending answer: ' + message);
                kaldi.close();
                text_to_speech.synthesize({
                  text: message,
                  voice: 'en-US_AllisonVoice',
                  accept: 'audio/wav'
                }).pipe(websocketStream(client));
            };

            var kaldi = new WebSocket(config.kaldi.url + '?content-type=audio/x-raw,layout=(string)interleaved,rate=(int)16000,format=(string)S16LE,channels=(int)1');
            kaldi.on('open', () => {
                //console.time('kaldi time');
                //console.log('kaldi started');
                var send = () => {
                    var i;
                    for(i = 0; i<buffer.length; i++) {
                        kaldi.send(buffer[i]);
                    }
                    buffer = [];
                };
                send();
                interval = setInterval(send, 250);
            });
            kaldi.on('message', (data, flags) => {
                var message = JSON.parse(data);
                if (message.status > 0) {
                    //console.timeEnd('kaldi time');
                    answer('Sorry, but I did not quite understand.');
                    return;
                }
                var result = message.result;
                if (result && result.final) {
                    //console.timeEnd('kaldi time');
                    answer(result.hypotheses[0].transcript);
                }
            });
        });
    }
};
