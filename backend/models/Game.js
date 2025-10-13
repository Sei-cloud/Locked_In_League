const mongoose = require('mongoose');

const playerStatSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team.roster' }, 
  points: Number,
  rebounds: Number,
  assists: Number,
  blocks: Number,
  steals: Number,
}, { _id: false });

const gameSchema = new mongoose.Schema({
  seasonYear: { type: Number, required: true },

  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },

  homeScore: { type: Number, required: true },
  awayScore: { type: Number, required: true },

  homeStats: { type: [playerStatSchema], default: [] },
  awayStats: { type: [playerStatSchema], default: [] },

}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
