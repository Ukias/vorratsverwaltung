// server.js


import express from "express";
import mongoose from 'mongoose';
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
import { getAllVorratsartikel, getVorratsartikelById, createVorratsartikel, updateVorratsartikel,
  deleteVorratsartikel, getVorratsartikelByUser, getStatistiken
 } from './controllers/vorratsController.js';
import { getKategorieById, getKategorienByUser, createKategorie, deleteKategorie, updateKategorie } from "./controllers/kategorieController.js";
import {login} from './controllers/authController.js'
import {register} from './controllers/registrationController.js'
import { authenticateToken } from './controllers/authController.js';
import rateLimiter from "./middleware/rateLimiter.js"
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve()

// Middleware
// app.use(cors());
if(process.env.NODE_ENV !== "production") {
  app.use(cors({
    origin: 'http://localhost:5173', // Ihre Frontend-URL
    credentials: true
  }));
}
// middleware
app.use(express.json());
app.use(rateLimiter)
// app.use((req, res,next) => {
//   console.log("We just got a new req")
//   next();
// });
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vorratsverwaltung', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
} catch(error) {
  console.error("Error connecting to MONGODB", error);
  process.exit(1);
}

// Multer Setup für Datei-Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB Limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt!'), false);
    }
  }
});

// Routes

// GET - Alle Vorratsartikel abrufen mit Sortierung
app.get('/api/vorratsartikel', getAllVorratsartikel);

// GET - Einzelnen Vorratsartikel abrufen (für Detailansicht)
app.get('/api/vorratsartikel/:id', getVorratsartikelById);

// POST - Neuen Vorratsartikel erstellen
app.post('/api/vorratsartikel', authenticateToken, upload.single('bild'), createVorratsartikel);

// PUT - Vorratsartikel bearbeiten
app.put('/api/vorratsartikel/:id', upload.single('bild'), updateVorratsartikel);

// DELETE - Vorratsartikel löschen
app.delete('/api/vorratsartikel/:id', deleteVorratsartikel);

// GET - Vorratsartikel eines Users abrufen
app.get('/api/vorratsartikelUser', authenticateToken, getVorratsartikelByUser);

// GET - Kategorien eines Users abrufen
app.get('/api/kategorienUser', authenticateToken, getKategorienByUser);

// GET - Einzelne Kategorie abrufen
app.get('api/kategorie/:id', getKategorieById);

// PUT - Kategorie bearbeiten
app.put('/api/kategorie/:id', updateKategorie);

// DELETE - Kategorie löschen
app.delete('/api/kategorie/:id', deleteKategorie);

// POST - Kategorie erstellen
app.post('/api/kategorie', authenticateToken, createKategorie);

// GET - Statistiken abrufen
app.get('/api/statistiken', getStatistiken);

// POST - Login 
app.post('/api/login', login);

// POST - Logout
app.post('/api/logout', (req, res) => {
  // console.log('logout is called')
  res.clearCookie('token'); // Falls JWT in Cookies gespeichert ist
  res.status(200).json({ message: 'Erfolgreich abgemeldet' });
});

// POST - registration
app.post('/api/registration', register);

// Error Handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Datei ist zu groß. Maximum 5MB erlaubt.' });
    }
  }
  res.status(500).json({ message: error.message });
});

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*",(req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist","index.html"))
  })
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint nicht gefunden' });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM empfangen, Server wird beendet...');
  mongoose.connection.close(() => {
    console.log('MongoDB Verbindung geschlossen.');
    process.exit(0);
  });
});

// module.exports = app;