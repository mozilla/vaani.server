const Utility = require('./utility.js');
const Creation = require('./creation.js');
const Evernote = require('evernote').Evernote;


// Function to save the Vaani note
function saveNote(values) {
  // Obtain note store
  var noteStore = Utility.getNoteStore(values.authtoken);

  // Create Promise to save Vaani note
  var promise = new Promise(function(resolve, reject) {
    noteStore.updateNote(values.authtoken, values.note, function(err, response) {
      if (err) {
        reject(err);
      } else {
        resolve(values);
      }
    });
  });

  // Return Promise for chaining
  return promise;
}

// Function to update Vaani nate
function updateNote(values) {
  var newContent = values.note.content.trim();

  newContent = newContent.substring(0, (newContent.length - 10)); // TODO: Modularize this
  newContent = newContent + '<en-todo/>' + values.itemName + '<br/></en-note>';  // TODO: Modularize this

  values.note.content = newContent;

  return values;
}

// Function to get Vaani note data
function getVaaniNote(values) {
  // Obtain note store
  var noteStore = Utility.getNoteStore(values.authtoken);

  // Create Promise to get Vaani note
  var promise = new Promise(function(resolve, reject) {
    noteStore.getNote(values.authtoken, values.vaaniNoteMeta.guid, true, false, false, false, function(err, note) {
      if (err) {
        reject(err);
      } else {
        values.note = note;
        resolve(values);
      }
    });
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
        values.vaaniNoteMeta = notesMetaData.notes[0];
        resolve(values);
      }
    });
  });

  // Return Promise for chaining
  return promise;
}

// Function to add Vaani note item
module.exports.addVaaniNoteItem = function(authtoken, itemName) {
  // Create object to hold passed values
  var values = new Object();
  values.itemName = itemName;
  values.authtoken = authtoken;

  // Create Vaani Note if it doesn't exist then add itemName
  return Creation.conditionallyCreateVaaniNote(values).then(getVaaniNoteMetaData).then(getVaaniNote).then(updateNote).then(saveNote);
}
