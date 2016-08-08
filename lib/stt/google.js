/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

(function () {

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const process = require('process');
const WebSocket = require('ws');
const google_rs = require('./google_rs');

exports.speech_to_text = (config) => { return {

    recognize: (params, callback) => {

        const problem = err => callback(JSON.stringify(err), null);

        const getBestHypothesis = res => {
            var result = { confidence: 0, transcript: '' },
                results = res.results;
            for (var i in results) {
                if (true == results[i].isFinal) {
                    var alternatives = results[i].alternatives;
                    for (var j in alternatives) {
                        var alternative = alternatives[j];
                        if (result.confidence < alternative.confidence) {
                            result.confidence = alternative.confidence;
                            result.transcript = alternative.transcript.trim();
                        }
                    }
                }
            }
            return result;
        };

        const doRecognition = () => {
            var speech_to_text = config._speechService.streamingRecognize(),
                foundAnswer = false;
            speech_to_text.on('error', err => problem(err));
            speech_to_text.on('data', res => {
                if (res && res.results && res.results.length) {
                    foundAnswer = true;
                    callback(null, getBestHypothesis(res));
                }
            });
            speech_to_text.on('end', () => {
                if(!foundAnswer)
                    callback(null, { confidence: 1, transcript: '' });
            });
            speech_to_text.write({
                streamingConfig: {
                    config: { encoding: 'LINEAR16', sampleRate: 16000 },
                    interimResults: false,
                    singleUtterance: true
                }
            });

            var toRecognizeRequest = new stream.Transform({ objectMode: true });
            toRecognizeRequest._transform =
                (chunk, encoding, done) => done(null, { audioContent: chunk });
            params.audio.pipe(toRecognizeRequest).pipe(speech_to_text);
        };

        if (config._speechService) {
            doRecognition();
        } else {
            const configPath = process.env['GOOGLE_APPLICATION_CREDENTIALS'] =
                path.join(__dirname, '..', '..', '.google.json');
            process.env['GCLOUD_PROJECT'] = config.GCLOUD_PROJECT;

            fs.writeFile(configPath, JSON.stringify(config), err => err ?
                problem(err) :
                google_rs.getSpeechService(config.host).then(
                    speechService => {
                        config._speechService = speechService;
                        doRecognition();
                    },
                    err => problem(err)
                )
            );
        }
    }

}};

})();
