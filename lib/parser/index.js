/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

(function () {

const parser = require('./sl-parser');

exports.parse = text => {
    var preprocessed = text
        .replace(/\[.*?\]/g, '')
        .replace(/\<.*?\>/g, '')
        .trim()
        .replace(/\s\-\s/g, ' ').replace(/\s-/g, ' ').replace(/\-\s/g, ' ');
    return parser.parse(preprocessed);
};

})();
