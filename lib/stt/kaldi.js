/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

(function () {

const WebSocket = require('ws');

exports.speech_to_text = (config) => { return {

    recognize: (params, callback) => {

        var kaldi = new WebSocket(
                config.url +
                '?content-type=audio/x-raw,layout=(string)interleaved,rate=(int)16000,format=(string)S16LE,channels=(int)1'
            );

        const problem = (err) => {
            kaldi.close();
            console.error('STT problem' + (err ? (': ' + JSON.stringify(err)) : ''));
            callback(err, null);
        };

        kaldi.on('open', () => {
            params.audio.on('data', (data) => kaldi.send(data));
            params.audio.on('end', (data) => kaldi.send('EOS'));
        });

        kaldi.on('message', (data, flags) => {
            try {
                var message = JSON.parse(data);
                if (message.status > 0) {
                    callback(message.status, null);
                    return;
                }
                var result = message.result;
                if (result && result.final) {
                    var hypothesis = result.hypotheses[0];
                    callback(null, {
                        transcript: hypothesis.transcript,
                        confidence: hypothesis.confidence
                    });
                }
            } catch (ex) {
                problem(ex);
            }
        });

        kaldi.on('error', err => problem(err));
    }

}};

})();
