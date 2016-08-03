/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

(function () {

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const https = require('https');
const stream = require('stream');
const express = require('express');
const shortid = require('shortid');
const WebSocketServer = require('ws').Server;
const evernote = require('./lib/evernote');
const stt = require('./lib/stt');
const watson = require('watson-developer-cloud');
const parser = require('./resources/sl-parser');

const sorryUnderstand = 'Sorry, but I did not quite understand.';
const sorryTooLong = 'Sorry, but this was a bit too long for me.';
const sorryService = 'Sorry, the service is not available at the moment.';
const unknown = '<unknown>';

const OK = 0;
const ERROR_PARSING = 1;
const ERROR_EXECUTING = 2;
const ERROR_STT = 100;

const logdir = './log/';
const ssldir = './resources/ssl/';

if (!fs.existsSync(logdir)){
    fs.mkdirSync(logdir);
}

const getConfig = () => {
    var config = JSON.parse(process.env.VAANI_CONFIG || fs.readFileSync("config.json"));
    config.secure = !!config.secure;
    config.port = process.env.PORT || config.port || (config.secure ? 443 : 80);
    config.maxwords = config.maxwords || 5;
    return config;
};

const serve = (config, callback) => {
    config = config || getConfig();

    var server;
    if(config.secure) {
        server = https.createServer({
            key:  fs.readFileSync(ssldir + 'server-key.pem'),
            cert: fs.readFileSync(ssldir + 'server-crt.pem'),
            ca:   fs.readFileSync(ssldir + 'ca-crt.pem'),
            passphrase: config.passphrase,
            requestCert: true,
            rejectUnauthorized: true
        });
    } else {
        server = http.createServer();
    }

    server.on('error', (error) => {
        console.log('Server problem: ' + error.message);
        process.exit(1);
    });

    const app = express();
    app.use((req, res) => {
        if (req.client.authorized) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{ "status": "approved" }');
            console.log('approved');
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end('{ "status": "denied" }');
            console.log('declined');
        }
    });
    server.on('request', app);

    server.listen(config.port);
    console.log('serving on port ' + config.port);

    const wss = new WebSocketServer({
        server: server
    });

    if (config.healthport) {
        http.createServer((req, res) => {
            res.end('I am alive!');
        }).listen(config.healthport);
        console.log('health status on port ' + config.port);
    }

    const speech_to_text = stt.speech_to_text(config.stt);
    const text_to_speech = watson.text_to_speech(config.tts.watson);

    wss.on('connection', (client) => {

        var audio = new stream.PassThrough(),
            logfile = path.join(logdir, shortid.generate()),
            rawlog = fs.createWriteStream(logfile + '.raw'),
            query = url.parse(client.upgradeReq.url, true).query,
            sttParams = { audio: audio };

        rawlog.on('error', (err) => {console.log('Problem logging audio: ' + err)});

        const fail = (message) => {
            rawlog.end();
            kaldi.close();
            client.close();
            console.log('Failed: ' + message);
        };

        const answer = (status, message, command, confidence) => {
            console.log('Sending answer: ' + status + ' - ' + message);
            try {
                var jsonResult = JSON.stringify({
                    status: status,
                    message: message,
                    command: command,
                    confidence: confidence || 1
                });

                client.send(jsonResult);

                fs.writeFile(
                    logfile + '.json',
                    jsonResult,
                    err => err && console.log("Problem logging json: " + err)
                );

                var voice = text_to_speech.synthesize({
                    text: [
                        '<express-as type="',
                            (status > 0 ? 'Apology' : ''),
                        '">',
                        message,
                        '</express-as>'
                    ].join(''),
                    voice: 'en-US_AllisonVoice',
                    accept: 'audio/wav'
                }, error => error ? fail('Problem with TTS service - ' + JSON.stringify(error)) : client.close());
                voice.on('data', data => (client.readyState == client.OPEN) && client.send(data));
                voice.on('end', () => { rawlog.end(); client.close(); });
            } catch(ex) {
                fail('answering');
            }
        };

        const interpret = (command, confidence) => {
            var product;
            command = command.replace(/\[.*?\]/g, '');
            try { product = parser.parse(command); } catch (ex) {
                console.log('Problem interpreting: ' + command);
                answer(ERROR_PARSING, sorryUnderstand, command, confidence);
                return;
            }
            if(product.split(' ').length > config.maxwords) {
                console.log('Product name too long: ' + product);
                answer(ERROR_PARSING, sorryTooLong, command, confidence);
                return;
            }
            evernote.addNoteItem(query.authtoken, product, config).then(function(){
                answer(OK, 'Added ' + product + ' to your shopping list.', command, confidence);
            }, function(err) {
                answer(ERROR_EXECUTING, sorryService, command, confidence);
            });
        };

        client.on('error', (error) => fail('client connection'));
        client.on('message', (data) => data === 'EOS' ? audio.end() : audio.write(data));

        speech_to_text.recognize(sttParams, (err, res) => err ?
            answer(ERROR_STT, sorryService, unknown, 0) :
            interpret(res.transcript, res.confidence)
        );


    });

    callback && callback();
};

exports.getConfig = getConfig;
exports.serve = serve;

})();
