import mongoose from "mongoose";

const kategorieSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    }, 
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
});

const Kategorie = mongoose.model('Kategorie', kategorieSchema);

export default Kategorie;