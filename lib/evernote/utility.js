const Constants = require('./constants.js');
const Evernote = require('evernote').Evernote;

// Function to obtain metadata for one Vaani note
module.exports.getNoteMeta = function(authtoken, sandbox, china, noteMetaFunction) {
  // Create a Evernote.Client
  var client = new Evernote.Client({
    token: authtoken,
    sandbox: !!sandbox,
    china: !!china
  });
  
  // Obtain note store
  var noteStore = client.getNoteStore();

  var filter = new Evernote.NoteFilter();
  filter.words = 'intitle:"' + Constants.vaaniNoteName + '"';

  var spec = new Evernote.NotesMetadataResultSpec();
  spec.includeTitle = true;

  noteStore.findNotesMetadata(authtoken, filter, 0, 1, spec, noteMetaFunction);
}

module.exports.getNoteStore = function(authtoken, sandbox, china) {
  // Create a Evernote.Client
  var client = new Evernote.Client({
    token: authtoken,
    sandbox: !!sandbox,
    china: !!china
  });

  // Obtain note store
  return client.getNoteStore();
}
