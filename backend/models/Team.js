// models/Team.js
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: String,
  number: Number,
  height: String,
  weight: String,
  age: Number,
  ppg: Number,
  fg: Number,
  assists: Number,
  rebounds: Number,
}, { _id: true }); // each player has its own _id

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roster: { type: [PlayerSchema], default: [] },
  year: { type: Number, required: true },
}, { timestamps: true });





module.exports = mongoose.model('Team', TeamSchema);
