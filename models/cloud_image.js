const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: String,
  category: String,
  imageUrl: String,
  embedding: [Number]  // Array of floats representing the vector embedding
});

module.exports = mongoose.model('CloudImage', imageSchema);
