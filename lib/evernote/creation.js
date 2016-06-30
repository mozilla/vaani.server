const Utility = require('./utility.js');
const Evernote = require('evernote').Evernote;
const Constants = require('./constants.js');

// Create Vaani note if it doesn't exist
module.exports.conditionallyCreateVaaniNote = function(authtoken, addVaaniNoteItemCallback) {
  // Create a Evernote.Client
  var client = new Evernote.Client({
    token: authtoken,
    sandbox: true,
    china: false
  });
  
  // Obtain note store
  var noteStore = client.getNoteStore();

  // Function to create Vaani Note
  function createVaaniNote() {
    var vaaniNote = new Evernote.Note();

    vaaniNote.title = Constants.vaaniNoteName;
    vaaniNote.content = Constants.initialNoteContent;

    noteStore.createNote(vaaniNote, function(err, note) {
      if (err) {
        throw err;
      }
      addVaaniNoteItemCallback();
    });
  }

  // Callback to create a Vaani note if none exists
  function conditionallyCreateVaaniNoteCallback(err, notesMeta) {
    if (err) {
      throw err;
    } else {
      if(0 == notesMeta.notes.length) {
        createVaaniNote();
      }
      addVaaniNoteItemCallback();
    }
  }

  // Create Vaani note if it doesn't exist
  Utility.getNoteMeta(authtoken, conditionallyCreateVaaniNoteCallback);
}
