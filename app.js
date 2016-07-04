#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';
const vaani = require('.');
const fs = require('fs');

const logit = (message) => {
    console.log(message);
    fs.appendFileSync('./server.log', message + '\n');
};

const logger = {
    info: (message) => logit('INFO: ' + message),
    warn: (message) => logit('WARN: ' + message),
    FAIL: (message) => logit('FAIL: ' + message)
}

logger.info('starting server...');
vaani.serve(null, () => {
    logger.info('server ready');
});
