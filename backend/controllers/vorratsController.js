// const Vorratsartikel = require('../models/Vorratsartikel.js');
import Vorratsartikel from "../models/Vorratsartikel.js";

export async function getAllVorratsartikel(req, res) {
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
}

export async function getVorratsartikelById(req, res) {
      try {
        const artikel = await Vorratsartikel.findById(req.params.id);
        if (!artikel) {
          return res.status(404).json({ message: 'Vorratsartikel nicht gefunden' });
        }
        res.json(artikel);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

export async function createVorratsartikel(req, res) {
      try {
        const { name, stueckzahl, haltbarkeitsdatum } = req.body;
        
        // Validierung
        if (!name || !stueckzahl) {
          return res.status(400).json({ message: 'Name und Stückzahl sind erforderlich' });
        }
        console.log("user id: ",req.user.id)
    
        const artikelData = {
          name: name.trim(),
          stueckzahl: parseInt(stueckzahl),
          haltbarkeitsdatum: haltbarkeitsdatum ? new Date(haltbarkeitsdatum) : null,
          bild: req.file ? req.file.filename : null,
          userId: req.user.id
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
}

export async function updateVorratsartikel(req, res) {
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
}

export async function deleteVorratsartikel(req, res) {
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
}

export async function getStatistiken(req, res) {
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
}
