import Kategorie from "../models/Kategorie.js"

export async function createKategorie(req, res) {
      try {
        const { name } = req.body;
        
        // Validierung
        if (!name) {
          return res.status(400).json({ message: 'Kategoriename ist erforderlich.' });
        }
    
        const kategorieData = {
          name: name.trim(),
          userId: req.user.id
        };
    
        const neueKategorie = new Kategorie(kategorieData);
        const gespeicherteKategorie = await neueKategorie.save();
        
        res.status(201).json(gespeicherteKategorie);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
}

export async function getKategorieById(req, res) {
      try {
        const kategorie = await Kategorie.findById(req.params.id);
        if (!kategorie) {
          return res.status(404).json({ message: 'Kategorie nicht gefunden' });
        }
        res.json(kategorie);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}

export async function getKategorienByUser (req, res) {
    try {
        const userKategorie = await Kategorie.find({ userId: req.user.id });
        res.json(userKategorie);
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateKategorie(req, res) {
    try {
        const {name} = req.body;
        const kategorie = await Kategorie.findById(req.params.id);
        if (!kategorie) {
          return res.status(404).json({ message: 'Kategorie nicht gefunden' });
        }

        // Update vorbereiten
        const updateData = {};
        if (name) updateData.name = name.trim();
        const aktualisierteKategorie = await Kategorie.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );

        res.json(aktualisierteKategorie);        
    } catch(error) {
        res.status(400).json({ message: error.message });
    }
}

export async function deleteKategorie(req, res) {
      try {
        const kategorie = await Kategorie.findById(req.params.id);
        if (!kategorie) {
          return res.status(404).json({ message: 'Kategorie nicht gefunden' });
        }
    
        await Kategorie.findByIdAndDelete(req.params.id);
        res.json({ message: 'Kategorie erfolgreich gelöscht' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}