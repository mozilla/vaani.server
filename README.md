
[![Build Status](https://travis-ci.org/mozilla/vaani.server.svg?branch=master)](https://travis-ci.org/mozilla/vaani.server)

Vaani server
------------
This is the back-end service for the Mozilla's Connected Devices project [Vaani local](https://wiki.mozilla.org/Vaani).
It provides all required functionality for the [Vaani client](https://github.com/mozilla/vaani.client).

Prerequisites
-----------
- Linux or OSX based system
- Node.js >= 4.0

Preparation
-----------
To be able to run the Vaani server, you need the following:
- A running instance of a [Kaldi speech to text (STT) gstreamer server](https://github.com/alumae/kaldi-gstreamer-server).
- An access token to the IBM Watson Text to speech (TTS) service. You can get one from [bluemix](https://bluemix.net).
- An authentication token for the Evernote sandbox server. You can get one from [Evernote](https://dev.evernote.com/).

Based on this requirements, you have to create a ```config.json``` file in the root of your cloned project. Here's how it should look like (replace all ```<some_*>``` fields by your specific values):

``` javascript
{
    "port": 8080,
    "kaldi": {
        "url": "wss://<some_ip>:<some_port>/client/ws/speech"
    },
    "watsontts": {
        "password": "<some_password_token>",
        "username": "<some_username_token>"
    },
    "evernote": {
        "authtoken": "<some_authentication_token>"
    }
}
```

Finally you should call
``` sh
npm install
```

Test client
-----------
The test client requires [SoX](http://sox.sourceforge.net/) audio tools to be installed (you can do this by ```brew install sox``` on Mac or ```apt-get install sox``` on Debians).
A full round trip test can be executed by:
``` sh
./vaani tell Add milk to my shopping list.
```
You should be able to use almost any other grocery product instead of milk.

In the above case, it will
- Start the server on localhost
- Take the sentence from the command line and convert it by Watson TTS into audio data
- Connect to the localhost server via WebSocket
- Send the audio data over and end the transmission with an "EOS" (end of stream) WebSocket message
- Wait for a JSON status message and print it to the console (first response message on the WebSocket connection)
- Receive subsequent Wave data messages till the connection gets closed
- Play back received Wave data

During this call, the server should
- Accept the incoming WebSocket connection
- Receive the client's PCM audio via that connection (till the "EOS" message is sent)
- Use the Kaldi STT server to translate that audio data into text (in the above case this will be "add milk to my shopping list.")
- Parse that sentence to extract the product name (in this case "milk") and build an answer from it ("Added milk to your shopping list.")
- Add the product (in this case "milk") to the Evernote "Vaani Shopping List", which may need to be created.
- Use the Watson TTS service to translate the answer text into speech audio data (Wave format)
- Send a JSON status message back to the client (containing a status code, textual forms of command and response and a confidence level)
- Send the answer audio data back to the client
- Close the WebSocket connection

Please consult
``` sh
./vaani --help
```
for further information on the test client.

Testing the parser
------------------
This is how you can just test the textual interpreter without any audio involved:
``` sh
./parse add milk to my shopping list
```
The output should be ```milk```. Be aware: It will fail, if the first word is upper case. Please look into ```resources/shoppinglist.jison``` (generated by
    [prepare.sh](https://github.com/mozilla/vaani.server/blob/master/resources/prepare.sh) from
    [shoppinglist-header.jison](https://github.com/mozilla/vaani.server/blob/master/resources/shoppinglist-header.jison) and
    [productlist.txt](https://github.com/mozilla/vaani.server/blob/master/resources/productlist.txt))
    for further information.

Running
-------
You can run the server by:
``` sh
npm run
```
