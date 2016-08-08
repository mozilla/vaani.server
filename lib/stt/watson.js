/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

(function () {

const watson = require('watson-developer-cloud');

exports.speech_to_text = (config) => { return {

    recognize: (params, callback) => {
        
        const problem = err => callback(JSON.stringify(err), null);

        const getBestHypothesis = res => {
            var result = { confidence: 0, transcript: '' },
                results = res.results;
            for (var i in results) {
                if (true == results[i].final) {
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

        if (!config._watsontts)
            config._watsontts = watson.speech_to_text(config);

        params.content_type = 'audio/l16; rate=16000';
        config._watsontts.recognize(
            params,
            (err, res) => err ? problem(err) : callback(null, getBestHypothesis(res))
        );
    }

}};

})();
