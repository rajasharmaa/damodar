require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || https://686fdbf5c817f20ef495d5ac--charming-gumption-ebc6bd.netlify.app;

// MongoDB Atlas connection
const uri = process.env.MONGODB_URI || "mongodb+srv://rajat:rajat888@cluster0.psa8nvb.mongodb.net/damodarTraders?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware
app.use(cors({
  origin: ['https://686fdbf5c817f20ef495d5ac--charming-gumption-ebc6bd.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Database connection
async function connectToDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    return client.db('damodarTraders');
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

// API Routes

// Create new product
app.post('/api/products', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please upload an image' });
  }

  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');

    const newProduct = {
      name: req.body.name || 'New Product',
      image: `/uploads/${req.file.filename}`,
      category: req.body.category || 'pipes',
      description: req.body.description || '',
      sizeOptions: req.body.sizeOptions ? JSON.parse(req.body.sizeOptions) : [{ size: '', price: 0 }],
      discount: parseFloat(req.body.discount) || 0,
      material: req.body.material || '',
      pressureRating: req.body.pressureRating || '',
      temperatureRange: req.body.temperatureRange || '',
      standards: req.body.standards || '',
      application: req.body.application || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await productsCollection.insertOne(newProduct);
    res.status(201).json({ ...newProduct, _id: result.insertedId });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().sort({ createdAt: -1 }).toArray();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by category
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({ 
      category: req.params.category 
    }).sort({ createdAt: -1 }).toArray();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products by category:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');

    // Get existing product
    const existingProduct = await productsCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prepare update data
    const updateData = {
      name: req.body.name || existingProduct.name,
      category: req.body.category || existingProduct.category,
      description: req.body.description || existingProduct.description,
      sizeOptions: req.body.sizeOptions ? JSON.parse(req.body.sizeOptions) : existingProduct.sizeOptions,
      discount: parseFloat(req.body.discount) || existingProduct.discount,
      material: req.body.material || existingProduct.material,
      pressureRating: req.body.pressureRating || existingProduct.pressureRating,
      temperatureRange: req.body.temperatureRange || existingProduct.temperatureRange,
      standards: req.body.standards || existingProduct.standards,
      application: req.body.application || existingProduct.application,
      updatedAt: new Date()
    };

    // If new image was uploaded
    if (req.file) {
      // Delete old image if it exists
      if (existingProduct.image) {
        const oldImagePath = path.join(__dirname, existingProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'No changes made to product' });
    }

    const updatedProduct = await productsCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const db = await connectToDB();
    const productsCollection = db.collection('products');

    // First get the product to delete its image
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete from database
    const result = await productsCollection.deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    // Delete the associated image file
    if (product.image) {
      const imagePath = path.join(__dirname, product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ 
      message: 'Product deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Serve admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});

// Close MongoDB connection when process ends
process.on('SIGINT', async () => {
  await client.close();
  process.exit();
});
