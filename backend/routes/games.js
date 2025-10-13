const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// CREATE a new game
router.post('/', async (req, res, next) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
});

// GET games by season
router.get('/:season', async (req, res, next) => {
  try {
    const games = await Game.find({ seasonYear: req.params.season })
      .populate('homeTeam')
      .populate('awayTeam')
      .exec();
    res.json(games);
  } catch (err) {
    next(err);
  }
});

// GET one game by ID
router.get('/id/:gameId', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.gameId)
      .populate('homeTeam')
      .populate('awayTeam')
      .exec();
    res.json(game);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
