const Utility = require('./utility.js');
const Evernote = require('evernote').Evernote;
const Constants = require('./constants.js');

// Function to create Vaani Note
function createVaaniNote(values) {
  // Create Promise to create Vaani Note
  var promise = new Promise(function(resolve, reject) {
    // If a Vaani note exists do nothing othewise create note
    if (0 != values.vaaniNotesMeta.length) {
      resolve(values);
    } else {
      // Obtain note store
      var noteStore = Utility.getNoteStore(values.authtoken);
    
      // Create initial note
      var vaaniNote = new Evernote.Note();
      vaaniNote.title = Constants.vaaniNoteName;
      vaaniNote.content = Constants.initialNoteContent;
  
      // Create Vaani note on server
      noteStore.createNote(vaaniNote, function(err, note) {
        if (err) {
          reject(err);
        } else {
          resolve(values);
        }
      });
    }
  });

  // Return Promise for chaining
  return promise;
}

// Function to get Vaani note meta data
function getVaaniNoteMetaData(values) {
  // Create Promise to obtain Vaani note meta data
  var promise = new Promise(function(resolve, reject) {
    Utility.getNoteMeta(values.authtoken, function(err, notesMetaData) {
      if (err) {
        reject(err);
      } else {
        values.vaaniNotesMeta = notesMetaData.notes;
        resolve(values);
      }
    });
  });

  // Return Promise for chaining
  return promise;
}

// Create Vaani note if it doesn't exist
module.exports.conditionallyCreateVaaniNote = function(values) {
  return getVaaniNoteMetaData(values).then(createVaaniNote);
}
