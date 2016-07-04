#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const fs = require('fs');
const readline = require('readline');

const resources = 'resources'
const shoppinglist = resources + '/shoppinglist.jison';
const utf8 = 'utf8';

var stream = fs.createReadStream(resources + '/shoppinglist-header.jison')
    .pipe(fs.createWriteStream(shoppinglist));

stream.on('finish',  () => {
    var writer = fs.createWriteStream(shoppinglist, { 'flags': 'a' }),
        reader = readline.createInterface({
            input: fs.createReadStream(resources + '/productlist.txt')
        }),
        lineno = 0;
    writer.write('\n', utf8);
    reader.on('line', (line) => {
        var tokens = line.split(' '),
            s = (lineno > 0 ? '    | ' : ' NP : ') +
                tokens.map((v, i) => '\"' + v + '\"').join(' ');
        lineno++;
        writer.write(
            s +
            (tokens.length > 1 ?
                (new Array(Math.max(0, 50 - s.length)).join(' ') +
                    '{ return ' +
                    tokens.map((v, i) => '$' + (i + 1)).join(' + \' \' + ') +
                    '; }'
                ) :
                ''
            ) +
            '\n',
            utf8
        );
    });
    reader.on('close', () => writer.write('    ;\n', utf8))
});
