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
  requiredPlayers: {
    type: Number,
    required: true
  },
  PlayersBySide: {
    type: Number,
    required: true
  },
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
