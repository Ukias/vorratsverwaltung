import mongoose from "mongoose";

const creditTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,        // negativ bei Verbrauch, positiv bei Kauf/Erstattung
  reason: String,        // z. B. "receipt_scan", "refund", "purchase"
  createdAt: { type: Date, default: Date.now }
});

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

export default CreditTransaction;