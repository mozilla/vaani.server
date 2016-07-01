/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const vaani = require('../index');
const WebSocket = require('ws');
const watson = require('watson-developer-cloud');
const child_process = require('child_process');

const config = vaani.getConfig();

config.port = 8080; // for development and testing, as port 80 is typically blocked
config.secure = false; // no security required for development and testing 

vaani.serve(config);

const text_to_speech = watson.text_to_speech({
    username: config.watsontts.username,
    password: config.watsontts.password,
    version: 'v1'
});

const call = (command, params) => child_process.spawn(command, params.split(' '));

const ws = new WebSocket(
    (config.secure ? 'wss' : 'ws') +
    '://localhost:' + config.port +
    '/?token=testtoken&authtoken=' + config.evernote.authtoken,
    null,
    { rejectUnauthorized: false }
);
ws.on('open', () => {
    var sox = call('sox', '-t wav - -t raw -b 16 -e signed -c 1 -r 16k -');
    sox.stdout.on('data', (data) => {
        ws.send(data);
    });
    sox.stdout.on('close', () => {
        ws.send('EOS');
    });
    text_to_speech.synthesize({
        text: process.argv.slice(2, process.argv.length).join(' '),
        voice: 'en-US_AllisonVoice',
        accept: 'audio/wav'
    }).pipe(sox.stdin);
});

var response;

if(process.env.VAANI_NO_AUDIO) {
    ws.on('close', (code, message) => {
        process.exit(response ? response.status : 1);
    });
    ws.on('message', (data, flags) => {
        if(!response) {
            console.log(response = JSON.parse(data));
        }
    });
} else {
    var player = call('play', '-t wav -');
    ws.on('message', (data, flags) => {
        if(response) {
            player.stdin.write(data);
        } else {
            console.log(response = JSON.parse(data));
        }
    });
    ws.on('close', (code, message) => {
        player.stdin.end();
    });
    player.stdout.on('close', () => {
        process.exit(response ? response.status : 1);
    });
}
