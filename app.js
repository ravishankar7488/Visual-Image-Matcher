//  Import required modules
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

//  Constants and configurations
const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY;
const CLARIFAI_INPUTS_URL = 'https://api.clarifai.com/v2/inputs';
const CLARIFAI_SEARCH_URL = 'https://api.clarifai.com/v2/searches';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const Image = require('./models/image.js');
const CloudImage = require('./models/cloud_image.js');

//  AWS S3 Setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

//  MongoDB Setup
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visual-product-matcher')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

//  Multer Setup for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

//  Route: Home Page
app.get('/', (req, res) => {
  res.render('index');
});

//  Route: Upload image (used for simple image input)
app.post('/upload', upload.single('image'), async (req, res) => {
  const imageUrl = '/uploads/' + req.file.filename;

  try {
    await Image.deleteMany({});
    const image = new Image({ imageUrl });
    await image.save();
    res.redirect('/result');
  } catch (err) {
    res.status(500).send('Error saving image');
  }
});

//  Route: Display uploaded images
app.get('/result', async (req, res) => {
  try {
    const result = await Image.find({});
    res.render('result', { result });
  } catch (err) {
    res.status(500).send('Error retrieving images');
  }
});

//  Route: Admin page to upload and seed images with metadata
app.get('/admin', (req, res) => {
  res.render('admin');
});

//  Route: Handle image upload and indexing (seeding)
app.post('/admin', upload.single('image'), async (req, res) => {
  const fileStream = fs.createReadStream(req.file.path);
  const s3Key = `${Date.now()}_${req.file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: fileStream,
    ContentType: req.file.mimetype,
  };

  try {
    //  Upload image to AWS S3
    const data = await s3.upload(params).promise();
    const { name, category } = req.body;

    //  Save image metadata to MongoDB
    const newImage = new CloudImage({
      name,
      category,
      imageUrl: data.Location,
    });
    await newImage.save();

    res.send(`Image uploaded: ${data.Location}`);

    //  Index image in Clarifai
    const payload = {
      inputs: [
        {
          data: {
            image: {
              url: data.Location
            },
            metadata: {
              name,
              category
            }
          }
        }
      ]
    };

    await axios.post(CLARIFAI_INPUTS_URL, payload, {
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Image indexed in Clarifai');

  } catch (err) {
    console.error('Upload or indexing error:', err.message);
    res.status(500).send('Upload failed');
  }
});

//  Route: Handle search for visually similar images
app.post('/search-similar', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const fileStream = fs.createReadStream(req.file.path);
  const s3Key = `${Date.now()}_${req.file.originalname}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
    Body: fileStream,
    ContentType: req.file.mimetype,
  };

  try {
    // Upload image to S3
    const s3Data = await s3.upload(params).promise();
    const imageUrl = s3Data.Location;
    console.log('Uploaded image URL:', imageUrl);

    // Index the image in Clarifai to generate embedding
    const indexPayload = {
      inputs: [
        {
          data: {
            image: {
              url: imageUrl
            }
          }
        }
      ]
    };

    await axios.post('https://api.clarifai.com/v2/inputs', indexPayload, {
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Perform search using image content (embedding similarity)
    const searchPayload = {
      query: {
        ands: [
          {
            input: {
              data: {
                image: {
                  url: imageUrl
                }
              }
            }
          }
        ]
      }
    };

    const searchResponse = await axios.post(CLARIFAI_SEARCH_URL, searchPayload, {
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const allResults = searchResponse.data.hits || [];
    const filteredResults = allResults.filter(hit => hit.score > 0.5);

    res.render('results', { results: filteredResults });

  } catch (error) {
    console.error('Error in searching similar images:', error.response ? error.response.data : error.message);
    res.status(500).send('Error searching for similar images');
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
