const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nomeCompleto: {
        type: String,
        required: true
    },
    setor: {
        type: String,
        required: true
    },
    telefone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    foto: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});
module.exports = mongoose.model('User', userSchema);