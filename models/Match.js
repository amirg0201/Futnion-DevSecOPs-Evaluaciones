const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  MatchName: {
    type: String,
    required: true
  },
  LocationName: {
    type: String,
    required: true
  },
  LocationPhotos: {
    type: [String],
    default: []
  },
  MatchDate: {
    type: Date,
    required: true 
  },
  MatchDuration: { 
    type: String,
    required: true, 
    trim: true
  },
  requiredPlayers: {
    type: Number,
    required: true
  },
  PlayersBySide: {
    type: Number,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo User
    required: true
  },
  participants: [{ // Un array de IDs de los usuarios que se han unido
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  }]
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
