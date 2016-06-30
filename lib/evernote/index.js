const Addition = require('./addition.js');

module.exports.addNoteItem = function(authtoken, itemName) {
  // Added itemName to Vaani note
  Addition.addVaaniNoteItem(authtoken, itemName);
}
