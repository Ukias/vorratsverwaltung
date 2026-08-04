import Anthropic from '@anthropic-ai/sdk';
import User from '../models/User.js';
import CreditTransaction from "../models/CreditTransaction.js";
import mongoose from "mongoose";

export const scanKassenzettel = async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ message: 'Kein Bild hochgeladen' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Guthaben für die Anfrage atomar für den User abziehen
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id, credits: { $gte: req.creditCost } },
      { $inc: { credits: -req.creditCost } },
      {new: true, session}
    );  

    if(!updatedUser) {
      throw new Error("Nicht genügend Guthaben");
    }

    // CreditTransaction für Anfrage in DB abspeichern
    await CreditTransaction.create(
      [{
        user: req.user.id,
        amount: -req.creditCost,
        reason: "receipt_scan"
      }],
      { session }
    );    

    await session.commitTransaction();
  } catch(error) {
    console.log("Fehler aufgetreten, Transaktionsstatus beim Fehler: ", session.inTransaction());
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    return res.status(500).json({message: "Fehler bei Datenbank-Transaktion: " + error.message})
  } finally {
    session.endSession();
  }

  // Request an Claude-Vision API für Kassenzettel durchführen
  try {
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: 'Erkenne alle Artikel auf diesem Kassenzettel. Gib mir eine JSON-Liste mit Objekten, die "name" (String, bereinigter Artikelname auf Deutsch) und "stueckzahl" (Number, Ganzzahl) enthalten. Wenn ein Artikel mehrfach vorkommt, summiere die Stückzahlen. Antworte NUR mit dem JSON-Array, ohne Erklärungen oder Markdown-Formatierung.',
            },
          ],
        },
      ],
    });

    const text = response.content[0].text.trim();
    // Strip potential markdown code fences
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const artikel = JSON.parse(cleaned);

    return res.json({ artikel });
  } catch (error) {
    console.error('Error scanning Kassenzettel:', error);
  }

  // Rückerstattung im Falle eines Fehlers im Bildverarbeitungs-Schritt. Bei Erfolg des zweiten Schrittes, wird "artikel" zurückgegeben und dieser dritte
  // Schritt wird übersprungen
  const sessionRefund = await mongoose.startSession();
  try {
    sessionRefund.startTransaction();
    // Rückerstattung des Guthabens für diese Anfrage an den User bei Fehlschlag
    const updatedUserRefund = await User.findOneAndUpdate(
      { _id: req.user.id},
      { $inc: { credits: req.creditCost } },
      { new: true, sessionRefund});
    // CreditTransaction für Rückerstattung in DB abspeichern
    CreditTransaction.create(
    [{
      user: req.user.id,
      amount: req.creditCost,
      reason: "refund"
    }],
    {sessionRefund}
    );

    await sessionRefund.commitTransaction();
  } catch(refundError) {
    if (sessionRefund.inTransaction()) {
      await sessionRefund.abortTransaction();
    }
    console.error("KRITISCH: Rückerstattung fehlgeschlagen", refundError);
    throw refundError;
  } finally {
    sessionRefund.endSession();
  }
  return res.status(500).json({error: "Scan fehlgeschlagen, Guthaben wurde zurückerstattet"});
};
