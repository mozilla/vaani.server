#!/usr/bin/env node
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

const fs = require('fs');
const readline = require('readline');

const resources = './resources'
const sljison = resources + '/shoppinglist.jison';
const slparser = resources + '/shoppinglist.js';
const utf8 = 'utf8';

module.exports.load = (callback) => {
    if(fs.existsSync(slparser)) {
        console.log('loading cached parser...');
        callback && callback(require('./shoppinglist').parser);
    } else {
        console.log('generating parser (intro)...');
        var stream = fs.createReadStream(resources + '/shoppinglist-header.jison')
            .pipe(fs.createWriteStream(sljison));

        stream.on('finish',  () => {
            console.log('generating parser (rules)...');
            var writer = fs.createWriteStream(sljison, { 'flags': 'a' }),
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
            reader.on('close', () => {
                console.log('generating parser (outro)...');
                writer.write('    ;\n', utf8);
                writer.on('finish', () => {
                    console.log('generating parser (build)...');
                    const jison = require('jison');
                    var parser = new jison.Parser(fs.readFileSync(sljison, utf8));
                    console.log('generating parser (write)...');
                    fs.writeFileSync(slparser, parser.generate());
                    callback && callback(parser);
                });
                writer.end();
            });
        });
    }
};
