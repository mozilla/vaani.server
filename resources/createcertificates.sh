#!/usr/bin/env sh
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

if [ ! -f key.pem ] && [ ! -f cert.pem ]; then
    echo "### Generating self-signed certificates"
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 10000 -nodes -subj "/C=DE/ST=Berlin/L=Berlin/O=Mozilla/OU=CD/CN=mozilla.com"
fi
