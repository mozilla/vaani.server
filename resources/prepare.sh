#!/usr/bin/env sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

set -e

cd resources

cp shoppinglist-header.jison shoppinglist.jison
cat productlist.txt | ./lmap "var tokens=line.split(' '),s=(lineno>0?'    | ':' NP : ')+tokens.map((v,i)=>'\"'+v+'\"').join(' '); return s+(tokens.length>1?(new Array(Math.max(0, 50-s.length)).join(' ') + '{ return ' + tokens.map((v,i)=>'$'+(i+1)).join(' + \' \' + ') + '; }'):'');" >> shoppinglist.jison
echo "    ;" >> shoppinglist.jison
../node_modules/.bin/jison shoppinglist.jison
