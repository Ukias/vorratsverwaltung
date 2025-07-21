// const mongoose = require('mongoose');
import mongoose from "mongoose";

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

export default Vorratsartikel;
