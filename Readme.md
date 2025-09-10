# 📸 Visual Product Matcher

The **Visual Product Matcher** is a web application that allows users to upload images and find matching images from a pre-seeded collection. It integrates cloud storage, MongoDB for metadata management, and the Clarifai API for image indexing and search functionality.

---

## 🚀 Features

- Upload images through a responsive and user-friendly interface.
- Store images securely in AWS S3.
- Manage image metadata such as name and category in MongoDB.
- Admin panel for uploading and managing images.
- Search functionality to find images by uploading a query image.
- Styled with Bootstrap for a modern, responsive design.

---

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating engine styled with Bootstrap
- **Database**: MongoDB for storing image metadata and URLs
- **Cloud Storage**: AWS S3 for image uploads and retrieval
- **Image Processing API**: Clarifai API for indexing images and attempting similarity-based searches

---

## 🔍 How Search Works

The application uses the **Clarifai API’s Inputs and Search endpoints** to handle image indexing and searching. When users upload a query image, the app attempts to search for visually similar images.

### ⚠ Limitation:

- Clarifai’s similarity search feature requires a paid subscription.
- Without this access, the app currently only returns exact matches where the image URL corresponds to an already seeded image.
- Advanced image similarity searches are not available in the free version of Clarifai's API.

---

## .env structure

- AWS_ACCESS_KEY_ID=Your AWS_ACCESS_KEY
- AWS_SECRET_ACCESS_KEY=Your AWS_SECRET_ACCESS_KEY
- AWS_REGION=Your AWS_REGION
- AWS_BUCKET_NAME=Your AWS_BUCKET_NAME
- CLARIFAI_API_KEY=Your CLARIFAI_API_KEY
- MONGO_URI=Your MONGO_URI

## 📂 Git Repository Link

https://github.com/your-username/visual-product-matcher.git

## 📂 Live Link

https://github.com/your-username/visual-product-matcher.git
