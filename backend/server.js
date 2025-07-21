// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vorratsverwaltung', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// MongoDB Schema
const vorratsartikelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  stueckzahl: {
    type: Number,
    required: true,
    min: 0
  },
  haltbarkeitsdatum: {
    type: Date,
    required: false
  },
  bild: {
    type: String,
    required: false
  },
  erstelltAm: {
    type: Date,
    default: Date.now
  },
  aktualisiertAm: {
    type: Date,
    default: Date.now
  }
});

// Middleware um aktualisiertAm zu setzen
vorratsartikelSchema.pre('save', function(next) {
  this.aktualisiertAm = new Date();
  next();
});

const Vorratsartikel = mongoose.model('Vorratsartikel', vorratsartikelSchema);

// Routes

// GET - Alle Vorratsartikel abrufen mit Sortierung
app.get('/api/vorratsartikel', async (req, res) => {
  try {
    const { sortBy = 'name', order = 'asc' } = req.query;
    
    let sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions = { name: order === 'desc' ? -1 : 1 };
        break;
      case 'stueckzahl':
        sortOptions = { stueckzahl: order === 'desc' ? -1 : 1 };
        break;
      case 'haltbarkeitsdatum':
        sortOptions = { haltbarkeitsdatum: order === 'desc' ? -1 : 1 };
        break;
      case 'erstelltAm':
        sortOptions = { erstelltAm: order === 'desc' ? -1 : 1 };
        break;
      default:
        sortOptions = { name: 1 };
    }

    const artikel = await Vorratsartikel.find().sort(sortOptions);
    res.json(artikel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Einzelnen Vorratsartikel abrufen (für Detailansicht)
app.get('/api/vorratsartikel/:id', async (req, res) => {
  try {
    const artikel = await Vorratsartikel.findById(req.params.id);
    if (!artikel) {
      return res.status(404).json({ message: 'Vorratsartikel nicht gefunden' });
    }
    res.json(artikel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Neuen Vorratsartikel erstellen
app.post('/api/vorratsartikel', upload.single('bild'), async (req, res) => {
  try {
    const { name, stueckzahl, haltbarkeitsdatum } = req.body;
    
    // Validierung
    if (!name || !stueckzahl) {
      return res.status(400).json({ message: 'Name und Stückzahl sind erforderlich' });
    }

    const artikelData = {
      name: name.trim(),
      stueckzahl: parseInt(stueckzahl),
      haltbarkeitsdatum: haltbarkeitsdatum ? new Date(haltbarkeitsdatum) : null,
      bild: req.file ? req.file.filename : null
    };

    const neuerArtikel = new Vorratsartikel(artikelData);
    const gespeicherterArtikel = await neuerArtikel.save();
    
    res.status(201).json(gespeicherterArtikel);
  } catch (error) {
    // Uploaded file löschen wenn Fehler auftritt
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// PUT - Vorratsartikel bearbeiten
app.put('/api/vorratsartikel/:id', upload.single('bild'), async (req, res) => {
  try {
    const { name, stueckzahl, haltbarkeitsdatum } = req.body;
    
    const artikel = await Vorratsartikel.findById(req.params.id);
    if (!artikel) {
      return res.status(404).json({ message: 'Vorratsartikel nicht gefunden' });
    }

    // Altes Bild löschen wenn neues hochgeladen wird
    if (req.file && artikel.bild) {
      const alteBildPath = path.join('uploads', artikel.bild);
      if (fs.existsSync(alteBildPath)) {
        fs.unlinkSync(alteBildPath);
      }
    }

    // Update-Daten vorbereiten
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (stueckzahl !== undefined) updateData.stueckzahl = parseInt(stueckzahl);
    if (haltbarkeitsdatum !== undefined) {
      updateData.haltbarkeitsdatum = haltbarkeitsdatum ? new Date(haltbarkeitsdatum) : null;
    }
    if (req.file) updateData.bild = req.file.filename;

    const aktualisierterArtikel = await Vorratsartikel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(aktualisierterArtikel);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Vorratsartikel löschen
app.delete('/api/vorratsartikel/:id', async (req, res) => {
  try {
    const artikel = await Vorratsartikel.findById(req.params.id);
    if (!artikel) {
      return res.status(404).json({ message: 'Vorratsartikel nicht gefunden' });
    }

    // Bild löschen falls vorhanden
    if (artikel.bild) {
      const bildPath = path.join('uploads', artikel.bild);
      if (fs.existsSync(bildPath)) {
        fs.unlinkSync(bildPath);
      }
    }

    await Vorratsartikel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vorratsartikel erfolgreich gelöscht' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Statistiken abrufen
app.get('/api/statistiken', async (req, res) => {
  try {
    const gesamtArtikel = await Vorratsartikel.countDocuments();
    const artikelMitBald = await Vorratsartikel.countDocuments({
      haltbarkeitsdatum: {
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 Tage
      }
    });
    const artikelOhneDatum = await Vorratsartikel.countDocuments({
      haltbarkeitsdatum: { $exists: false }
    });

    res.json({
      gesamtArtikel,
      artikelMitBald,
      artikelOhneDatum
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error Handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Datei ist zu groß. Maximum 5MB erlaubt.' });
    }
  }
  res.status(500).json({ message: error.message });
});

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

module.exports = app;