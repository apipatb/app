const multer = require('multer');
const path = require('path');
const { logger } = require('../utils/logger');

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Storage configuration for multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter - only allow images
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only JPEG, PNG, and WebP images are allowed. Got: ${file.mimetype}`), false);
  }
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5 // Max 5 files per request
  }
});

/**
 * Single file upload middleware
 */
const uploadSingle = (fieldName = 'image') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);

    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum size is 5MB.'
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files. Maximum is 5 files.'
          });
        }

        return res.status(400).json({
          success: false,
          error: err.message
        });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      next();
    });
  };
};

/**
 * Multiple files upload middleware
 */
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);

    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File too large. Maximum size is 5MB per file.'
          });
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: `Too many files. Maximum is ${maxCount} files.`
          });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: `Unexpected field name. Use '${fieldName}' as the field name.`
          });
        }

        return res.status(400).json({
          success: false,
          error: err.message
        });
      } else if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }

      next();
    });
  };
};

/**
 * Delete file helper
 */
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  deleteFile,
  uploadDir
};
