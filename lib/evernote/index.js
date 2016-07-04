const Addition = require('./addition.js');

module.exports.addNoteItem = function(authtoken, itemName) {
  // Execute boundAddVaaniNoteItem
  return Addition.addVaaniNoteItem(authtoken, itemName);
}
