/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const vaani = require('../index');
const WebSocket = require('ws');
const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');


fs.readFile("config.json", (err, data) => {
    var config = vaani.getConfig();
    vaani.serve(config);
    var ws = new WebSocket('wss://localhost:' + config.port + '/?token=testtoken', null, { rejectUnauthorized: false });
    ws.on('open', () => {
        fs.readFile('test/resources/helloworld.raw', (err, data) => {
            if (err) throw err;
            ws.send(data);
            ws.send('EOS');
        });
    });
    var sink = new wav.Reader();
    var speaker;
    sink.on('format', function (format) {
        speaker = new Speaker(format);
        setTimeout(function() {
            sink.pipe(speaker);
        }, 250);
    });
    sink.on('close', () => { speaker && speaker.close(); });
    ws.on('message', (data, flags) => {
        sink.write(data);
    });
    ws.on('close', () => {
        setTimeout(function() {
            process.exit(0);
        }, 1000);
    });
});
