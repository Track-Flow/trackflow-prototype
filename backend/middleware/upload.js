const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain',
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const FILE_TYPE_ERROR = 'File type not allowed. Only images, PDF, and plain text files are accepted.';

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const err = new Error(FILE_TYPE_ERROR);
    err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });

// Wraps upload.single() so Multer rejections come back as clean 400 JSON
// instead of falling through to Express's default HTML error page with a
// stack trace (TC-ATT-02, TC-ATT-03).
function singleFile(fieldName) {
  const handler = upload.single(fieldName);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: `Upload rejected: ${err.message}` });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: FILE_TYPE_ERROR });
      }
      return next(err);
    });
  };
}

module.exports = upload;
module.exports.singleFile = singleFile;
module.exports.MAX_FILE_SIZE = MAX_FILE_SIZE;