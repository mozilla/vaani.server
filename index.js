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
const parser = require('./lib/parser');

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

    const log = s => console.log('T: ' + new Date().toISOString() + ' - ' + s);

    var server,
        clientcounter = 0;

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
        log('server problem - ' + error.message);
        process.exit(1);
    });

    const app = express();
    app.use((req, res) => {
        if (req.client.authorized) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{ "status": "approved" }');
            log('sending status approved');
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end('{ "status": "denied" }');
            log('sending status declined');
        }
    });
    server.on('request', app);

    server.listen(config.port);
    log('serving on port ' + config.port);

    const wss = new WebSocketServer({
        server: server
    });

    if (config.healthport) {
        http.createServer((req, res) => {
            res.end('I am alive!');
        }).listen(config.healthport);
        log('health status on port ' + config.port);
    }

    const speech_to_text = stt.speech_to_text(config.stt);
    const text_to_speech = watson.text_to_speech(config.tts.watson);

    wss.on('connection', (client) => {

        var clientindex = clientcounter++;
        const log = s => console.log(
            'T: ' + new Date().toISOString() + ' ' +
            'C: ' + clientindex + ' - ' + s);

        var audio = new stream.PassThrough(),
            logfile = path.join(logdir, shortid.generate()),
            rawlog = fs.createWriteStream(logfile + '.raw'),
            query = url.parse(client.upgradeReq.url, true).query,
            sttParams = { audio: audio };

        audio.on('error', err => log('problem passing audio - ' + err));
        rawlog.on('error', err => log('problem logging audio - ' + err));

        const writeToSinks = data => {
            audio.write(data);
            rawlog.write(data);
        };

        const closeSinks = () => {
            audio.end();
            rawlog.end();
        };

        const fail = (message) => {
            closeSinks();
            client.close();
            log('failed - ' + message);
        };

        const answer = (status, message, command, confidence) => {
            log('sending answer - ' + status + ' - ' + message);
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
                    err => err && log("problem logging json - " + err)
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
                }, err => err ? fail('problem with TTS service - ' + err) : client.close());
                voice.on('data', data => (client.readyState == client.OPEN) && client.send(data));
                voice.on('end', () => client.close());
            } catch(ex) {
                fail('answering - ' + JSON.stringify(ex));
            }
        };

        const interpret = (command, confidence) => {
            var product;
            try { product = parser.parse(command); } catch (ex) {
                log('problem interpreting - ' + command);
                answer(ERROR_PARSING, sorryUnderstand, command, confidence);
                return;
            }
            if(product.split(' ').length > config.maxwords) {
                log('product name too long - ' + product);
                answer(ERROR_PARSING, sorryTooLong, command, confidence);
                return;
            }

            if(query.authtoken) {
                evernote.addNoteItem(query.authtoken, product, config).then(function(){
                    answer(OK, 'Added ' + product + ' to your shopping list.', command, confidence);
                }, err => {
                    log('problem Evernote - ' + err);
                    answer(ERROR_EXECUTING, sorryService, command, confidence);
                });
            } else {
                answer(OK, 'Virtually added ' + product + ' to your shopping list.', command, confidence);
            }
        };

        client.on('error', err => fail('client connection' + err));
        client.on('message', data => data === 'EOS' ? closeSinks() : writeToSinks(data));

        speech_to_text.recognize(sttParams, (err, res) => {
            if(err) {
                log('problem STT - ' + err);
                answer(ERROR_STT, sorryService, unknown, 0);
            } else
                interpret(res.transcript, res.confidence);
            }
        );


    });

    callback && callback();
};

exports.getConfig = getConfig;
exports.serve = serve;

})();
