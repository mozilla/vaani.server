#!/usr/bin/env sh

set -e

cd resources

cp shoppinglist-header.jison shoppinglist.jison
cat productlist.txt | ./lmap "var tokens=line.split(' '),s=(lineno>0?'    | ':' NP : ')+tokens.map((v,i)=>'\"'+v+'\"').join(' '); return s+(tokens.length>1?(new Array(Math.max(0, 50-s.length)).join(' ') + '{ return ' + tokens.map((v,i)=>'$'+(i+1)).join(' + \' \' + ') + '; }'):'');" >> shoppinglist.jison
echo "    ;" >> shoppinglist.jison
../node_modules/.bin/jison shoppinglist.jison

if [ ! -f key.pem ] && [ ! -f cert.pem ]; then
    echo "### Generating self-signed certificates"
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 10000 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=Mozilla/OU=CD/CN=mozilla.com"
fi

type sox >/dev/null 2>&1 || { echo >&2 "The tests require sox audio tools. Please install them before executing any test."; }
