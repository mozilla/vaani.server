const Domain = require('domain');
const Addition = require('./addition.js');

module.exports.addNoteItem = function(authtoken, itemName) {
  // Create domain to intercept unhandled errors
  var domain = Domain.create();

  // Log errors in domain
  domain.on('error', function(err){
	console.log(err);
  });

  // Added itemName to Vaani note
  var boundAddVaaniNoteItem = Addition.addVaaniNoteItem.bind(undefined, authtoken, itemName);

  // Execute boundAddVaaniNoteItem in domain
  domain.run(boundAddVaaniNoteItem);
}
