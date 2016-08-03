// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const path = require('path');
const grpc = require('grpc');
const Transform = require('stream').Transform;
const googleAuth = require('google-auto-auth');
const googleProtoFiles = require('google-proto-files');

var PROTO_ROOT_DIR = googleProtoFiles('..');

var protoDescriptor = grpc.load({
  root: PROTO_ROOT_DIR,
  file: path.relative(PROTO_ROOT_DIR, googleProtoFiles.speech.v1beta1)
}, 'proto', {
  binaryAsBase64: true,
  convertFieldsToCamelCase: true
});

var speechProto = protoDescriptor.google.cloud.speech.v1beta1;

function getSpeechService(host) {
  // Create Promise to get SpeechService
  var promise = new Promise(function(resolve, reject) {
    var googleAuthClient = googleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform'
      ]
    });

    googleAuthClient.getAuthClient(function (err, authClient) {
      if (err) {
        reject(err);
      } else {
        var credentials = grpc.credentials.combineChannelCredentials(
          grpc.credentials.createSsl(),
          grpc.credentials.createFromGoogleCredential(authClient)
        );
        var speech = new speechProto.Speech(host, credentials);
        resolve(speech);
      }
    });
  });

  return promise;
}

module.exports.getSpeechService = getSpeechService;
