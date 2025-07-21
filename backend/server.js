// server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const Vorratsartikel = require('./models/Vorratsartikel.js');
import { getAllVorratsartikel, getVorratsartikelById, createVorratsartikel, updateVorratsartikel,
  deleteVorratsartikel, getStatistiken
 } from './controllers/vorratsController.js';
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

import express from "express";
import mongoose from 'mongoose';
import Vorratsartikel from './models/Vorratsartikel.js';
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
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
app.post('/api/vorratsartikel', upload.single('bild'), createVorratsartikel);

// PUT - Vorratsartikel bearbeiten
app.put('/api/vorratsartikel/:id', upload.single('bild'), updateVorratsartikel);

// DELETE - Vorratsartikel löschen
app.delete('/api/vorratsartikel/:id', deleteVorratsartikel);

// GET - Statistiken abrufen
app.get('/api/statistiken', getStatistiken);

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

// module.exports = app;