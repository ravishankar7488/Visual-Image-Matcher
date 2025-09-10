const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  imageUrl: String,
});

const Image=mongoose.model("Image", ImageSchema)
module.exports = Image;