import Fuse from 'fuse.js'
import Vorratsartikel from "../models/Vorratsartikel.js";

export async function fuzzyMatching(req, res) {
    // get Artikel of user only
    const artikelDB = await Vorratsartikel.find({ userId: req.user.id });
    const artikelScan = req.body;

    // entferne Mengen-, Volumen-, Gewichts-, Stück-, Prozentangaben mittels regulären Ausdrücken
    for(let i=0; i<artikelScan.length; i++) {
        const VOLUMEN_GEWICHT = /\d+[.,]?\d*\s?(g|kg|ml|l|L)\b/gi;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(VOLUMEN_GEWICHT, " ");

        const MEHRFACHPACKUNGEN = /\d+\s?x\s?\d+[.,]?\d*\s?(g|kg|ml|l)?/gi;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(MEHRFACHPACKUNGEN, " ");

        const XERPACKUNGEN = /\d+er(\s?Pack)?/gi;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(XERPACKUNGEN, " ");

        const PROZENTANGABEN = /\d+[.,]?\d*\s?%/g;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(PROZENTANGABEN, " ");

        const KLAMMERINHALTE = /\([^)]*\)/g;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(KLAMMERINHALTE, " ");

        const BIO = /bio/gi;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(BIO, " ");

        const SONDERZEICHEN_AUFRAUEMEN = /\s{2,}/g;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(SONDERZEICHEN_AUFRAUEMEN, " ");

        const TRIMMEN = /^\W+|\W+$/g;
        artikelScan[i]['name'] = artikelScan[i]['name'].replace(TRIMMEN, "");

        // zu Lowercase konvertieren
        artikelScan[i]['name'] = artikelScan[i]['name'].toLowerCase();

        console.log(i, artikelScan[i]['name']);
    }
    
    // create fuse
    const fuse = new Fuse(artikelDB, {
        keys: ['name'],
        includeScore: true, 
        threshold: 0.35 // muss ggbf. für längere Wörter erhöht werden; Wert zwischen 0 und 1, standardmäßig 0.6, Werte näher an 0 sind stärker eingrenzend
    })

    // führe Fuzzy-Matching durch
    for(let i=0; i<artikelScan.length; i++) {
        const fuse_res = fuse.search(artikelScan[i]['name']);
        console.log(fuse_res);
    }
}