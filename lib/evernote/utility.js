const Constants = require('./constants.js');
const Evernote = require('evernote').Evernote;

// Function to obtain metadata for one Vaani note
module.exports.getNoteMeta = function(authtoken, noteMetaFunction) {
  // Create a Evernote.Client
  var client = new Evernote.Client({
    token: authtoken,
    sandbox: true,
    china: false
  });
  
  // Obtain note store
  var noteStore = client.getNoteStore();

  var filter = new Evernote.NoteFilter();
  filter.words = 'intitle:"' + Constants.vaaniNoteName + '"';

  var spec = new Evernote.NotesMetadataResultSpec();
  spec.includeTitle = true;

  noteStore.findNotesMetadata(authtoken, filter, 0, 1, spec, noteMetaFunction);
}
