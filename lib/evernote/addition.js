const Utility = require('./utility.js');
const Creation = require('./creation.js');
const Evernote = require('evernote').Evernote;

// Function to add Vaani note item
function addVaaniNoteItem(authtoken, itemName) {
  // Create a Evernote.Client
  var client = new Evernote.Client({
    token: authtoken,
    sandbox: true,
    china: false
  });
  
  // Obtain note store
  var noteStore = client.getNoteStore();

  // Update passed note with itemName
  function updateNote(note) {
    var newContent = note.content;

    newContent = newContent.substring(0, (newContent.length - 10)); // TODO: Modularize this
    newContent = newContent + '<en-todo/>' + itemName + '<br/></en-note>';  // TODO: Modularize this

    note.content = newContent;
  }

  function getVaaniNote(vaaniNoteMeta) {
    noteStore.getNote(authtoken, vaaniNoteMeta.guid, true, false, false, false, function(err, note) {
      if (err) {
        throw err;
      } else {
        updateNote(note);
        noteStore.updateNote(authtoken, note, function(err, response) {
          if (err) {
            throw err;
          }
        });
      }
    });
  }

  function getVaaniNoteMetaCallback(err, notesMeta) {
    if (err) {
      throw err;
    } else if (0 != notesMeta.notes.length) {
      getVaaniNote(notesMeta.notes[0]);
    }
  }

  Utility.getNoteMeta(authtoken, getVaaniNoteMetaCallback);
}

// Function to add Vaani note item
module.exports.addVaaniNoteItem = function(authtoken, itemName) {
  // Create callback
  var addVaaniNoteItemCallback = addVaaniNoteItem.bind(undefined, authtoken, itemName);

  // Create Vaani note if it doesn't exist and add itemName to it
  Creation.conditionallyCreateVaaniNote(authtoken, addVaaniNoteItemCallback);
}
