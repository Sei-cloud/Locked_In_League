// routes/teams.js
const express = require("express");
const router = express.Router();
const Team = require("../models/Team");

// GET /api/teams - list all teams
router.get("/", async (req, res, next) => {
  try {
    const teams = await Team.find().lean();
    res.json(teams);
  } catch (err) {
    next(err);
  }
});

// POST /api/teams - create a new team
router.post("/", async (req, res, next) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

// GET /api/teams/:id
router.get("/:id", async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teams/:id - update team metadata (name/city/coach)
router.put("/:id", async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* Players endpoints (embedded documents) */

// POST /api/teams/:id/players - add a player
router.post("/:id/players", async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    team.roster.push(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teams/:id/players/:playerId - update a player
router.put("/:id/players/:playerId", async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    const player = team.roster.id(req.params.playerId);
    if (!player) return res.status(404).json({ error: "Player not found" });
    Object.assign(player, req.body);
    await team.save();
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teams/:id/players/:playerId
router.delete("/:id/players/:playerId", async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    const player = team.roster.id(req.params.playerId);
    if (!player) return res.status(404).json({ error: "Player not found" });
    team.roster.pull(player._id);
    await team.save();
    res.json(team);
  } catch (err) {
    next(err);
  }
});

// optional: Seed default teams if none exist
router.post("/_seed/defaults", async (req, res, next) => {
  try {
    const count = await Team.countDocuments();
    if (count > 0) return res.json({ ok: "already seeded" });

    const defaultTeams = Array.from({ length: 14 }, (_, i) => ({
      name: `Team ${String.fromCharCode(65 + i)}`,
      city: `City ${i + 1}`,
      coach: `Coach ${String.fromCharCode(65 + i)}`,
      roster: Array.from({ length: 10 }, (_, j) => {
        const base = i * 10 + j;
        return {
          name: `Player ${j + 1} (${String.fromCharCode(65 + i)})`,
          position: ["G", "F", "C"][j % 3],
          number: j + 1,
          height: `${180 + (j % 5) * 3} cm`,
          weight: `${75 + (j % 7) * 2} kg`,
          age: 19 + (j % 5),
          ppg: Number((8 + (base % 10) + Math.random() * 5).toFixed(1)),
          fg: Number((40 + (base % 20) + Math.random() * 10).toFixed(1)),
          assists: Number((2 + (base % 5) + Math.random() * 2).toFixed(1)),
          rebounds: Number((3 + (base % 6) + Math.random() * 2).toFixed(1)),
        };
      }),
    }));

    await Team.insertMany(defaultTeams);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
