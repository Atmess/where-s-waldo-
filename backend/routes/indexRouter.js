require('dotenv').config()
const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller')
const filecontroller = require('../controllers/filecontroller')
const gamecontroller = require('../controllers/gamecontroller')
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET
const multer = require('multer')
const path = require('path');


// Define allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  // Archives & Compressed (RAR, ZIP, 7Z)
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/octet-stream' // Browsers fall back to binary streams
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar', '.7z'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_MIME_TYPES.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed files: Images, Docs, ZIP, RAR, 7Z.'), false);
    }
  }
});
const FilterFile = (req, res, next) => {
  upload.single("upload")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File size too large! Maximum limit is 50 MB." }); // 👈 Changed to .json()
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` }); // 👈 Changed to .json()
    } else if (err) {
      return res.status(400).json({ message: err.message }); // 👈 Changed to .json()
    }
    next();
  });
}

const authenticateToken=(req, res, next)=> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    if (req.accepts('html')) return res.redirect('/login');
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = decodedUser; // Attach user payload ({ id, username }) to request
    next();
  });
}
// 1. Defined as '/'
router.get('/', (req, res) => {
  res.json({ message: "Welcome to the Blog API" });
});



// 3. Defined as '/login'
router.post('/login', controller.login);
router.post('/register',controller.registerpost)

// game section
router.post('/game/start',gamecontroller.gameStart)
router.post('/game/guess',gamecontroller.gameGuess)
router.post('/game/score',gamecontroller.inputScore)

// leaderboard section
router.get('/leaderboard',gamecontroller.getLeaderboard)

router.use(authenticateToken)

//User Section
router.patch('/users/profile',FilterFile,filecontroller.uploadfile , controller.UpdateUser)

module.exports = router;