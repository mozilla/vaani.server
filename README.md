Vaani server
------------

This is the Vaani server project. It provides all required back-end functionality for the [Vaani client](https://github.com/mozilla/vaani.client).

Preparation
-----------

To be able to run the Vaani server, you need the following:
- A running instance of a [Kaldi speech to text (STT) gstreamer server](https://github.com/alumae/kaldi-gstreamer-server).
- An access token to the IBM Watson Text to speech (TTS) service. You can get one from [bluemix](https://bluemix.net).

Based on this requirements, you need to create a ```config.json``` file in the root of your cloned project. Here's how it should look like (replace all ```<some_*>``` fields by your specific values):

```javascript
{
    "port": 8080,
    "kaldi": {
        "url": "wss://<some_ip>:<some_port>/client/ws/speech"
    },
    "watsontts": {
        "password": "<some_password_token>",
        "username": "<some_username_token>"
    }
}
```

Finally you should call
``` sh
npm install
```

Testing
-------
A full round trip test can be executed by:
``` sh
node test/tests.js Add milk to my shopping list.
```
You should be able to use almost any other grocery product instead of milk.

It will
 - Start the server on localhost
 - Take the sentence from the command line and convert it by Watson TTS into audio data
 - Connect to the localhost server via WebSocket
 - Send the audio data over and end the transmission with an "EOS" (end of stream) WebSocket message
 - Wait for a resulting Wave file to be sent back (over the same WebSocket connection)
 - Play back the Wave file

During this test, the server should
 - Accept the incoming WebSocket connection
 - Receive the client's PCM audio via that connection (till the "EOS" message is sent)
 - Use the Kaldi STT server to translate that audio data into text (in the above case this will be "add milk to my shopping list.")
 - Parse that sentence to extract the product name (in this case "milk") and build an answer from it ("Added milk to your shopping list.")
 - Use the Watson TTS service to translate the answer text into a speech audio file (Wave format)
 - Send that speech file back to the client (still using the same WebSocket connection)
 - Close the WebSocket connection

You can also use test the textual interpreter without any audio involved:
 ``` sh
 ./parse add milk to my shopping list
 ```
 The output should be ```milk```. Bw aware: It will fail, if the first word is upper case. Please look into ```resources/shoppinglist.jison``` for further information.

Running
-------
For just running the server use:
``` sh
npm run
```
