const Addition = require('./addition.js');

module.exports.addNoteItem = function(authtoken, itemName, config) {
  // Execute boundAddVaaniNoteItem
  return Addition.addVaaniNoteItem(authtoken, itemName, config);
}
