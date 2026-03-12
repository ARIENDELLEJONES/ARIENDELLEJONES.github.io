const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const uploadsDir = path.join(__dirname, '..', '..', 'images', 'uploads');

// Ensure directory exists
fs.ensureDirSync(uploadsDir);

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter: images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Images only (jpg, png, gif, webp, svg).'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 
  } 
});

// POST /api/upload - Upload image
function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    res.json({ 
      success: true, 
      path: relativePath, 
      filename: req.file.filename,
      size: req.file.size 
    });
  });
}

module.exports = { uploadImage };
