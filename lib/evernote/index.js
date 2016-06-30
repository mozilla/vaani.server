const Addition = require('./addition.js');
const Creation = require('./creation.js');

module.exports.addNoteItem = function(authtoken, itemName) {
  // Create Vaani note if it doesn't exist
  Creation.conditionallyCreateVaaniNote(authtoken);

  // Added itemName to Vaani note
  Addition.addVaaniNoteItem(authtoken, itemName);
}
