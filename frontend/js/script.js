// public/js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.location.hostname === "localhost" ? "http://localhost:4000" : "";
  let teams = [];

  // -------------------------
  // Section Navigation
  // -------------------------
  const sections = ["boxscore", "roster", "team-info", "player-info", "league-info", "season"];
  let lastSection = localStorage.getItem("lockedInLeagueLastSection") || "boxscore";

  sections.forEach((section) => {
    const nav = document.getElementById("nav-" + section);
    if (nav) {
      nav.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(section);
      });
    }
  });

  function showSection(section) {
    sections.forEach((sec) => {
      const el = document.getElementById(sec);
      if (el) el.style.display = sec === section ? "" : "none";
    });
    if (section !== "season") document.getElementById("season").style.display = "none";
    localStorage.setItem("lockedInLeagueLastSection", section);
  }

  // -------------------------
  // Team & Player API Helpers
  // -------------------------
  const api = {
    getTeams: async () => (await fetch(`${API_BASE}/api/teams`)).json(),
    createTeam: async (team) =>
      (await fetch(`${API_BASE}/api/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(team),
      })).json(),
    updateTeam: async (id, payload) =>
      (await fetch(`${API_BASE}/api/teams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })).json(),
    deleteTeam: async (id) => (await fetch(`${API_BASE}/api/teams/${id}`, { method: "DELETE" })).json(),
    addPlayer: async (teamId, player) =>
      (await fetch(`${API_BASE}/api/teams/${teamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      })).json(),
    updatePlayer: async (teamId, playerId, payload) =>
      (await fetch(`${API_BASE}/api/teams/${teamId}/players/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })).json(),
    deletePlayer: async (teamId, playerId) =>
      (await fetch(`${API_BASE}/api/teams/${teamId}/players/${playerId}`, { method: "DELETE" })).json(),
  };

  // -------------------------
  // Modal Logic (Reusable)
  // -------------------------
  const modal = document.getElementById("player-modal");
  const modalContainer = modal.querySelector(".player-stats");

  function openModal(html) {
    modalContainer.innerHTML = html;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  document.getElementById("close-player-modal").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // -------------------------
  // Team Rendering
  // -------------------------
  const teamInfoContent = document.getElementById("team-info-content");

  function rerenderTeams(expandTeamId = null) {
    teamInfoContent.innerHTML = "";
    teams.forEach((team) => {
      const teamDiv = document.createElement("div");
      teamDiv.className = "team-block";

      const rosterHtml = team.roster
        .map(
          (p) => `
          <li style="display:flex;align-items:center;gap:0.5rem;">
            <span class="player-link" tabindex="0" data-team="${team._id}" data-player="${p._id}">#${p.number} ${p.name} - ${p.position}</span>
            <button class="edit-player-btn" data-team="${team._id}" data-player="${p._id}" style="font-size:0.9em;padding:0.1em 0.5em;">Edit</button>
            <button class="delete-player-btn" data-team="${team._id}" data-player="${p._id}" style="font-size:0.9em;padding:0.1em 0.5em;background:#e53935;color:#fff;">Delete</button>
          </li>`
        )
        .join("");

      teamDiv.innerHTML = `
        <div class="team-header" tabindex="0" style="display:flex;align-items:center;justify-content:space-between;padding:0.5em 0.7em;">
          <strong style="flex:1;text-align:left;">${team.name}</strong>
          <span class="expand-arrow" style="margin-left:auto;font-size:1.2em;cursor:pointer;">&#9654;</span>
        </div>
        <div class="team-roster" style="display:none;">
          <button class="add-player-btn" data-team="${team._id}" style="margin-bottom:0.7em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Add Player</button>
          <button class="edit-team-btn" data-team="${team._id}" style="margin-left:0.5em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Edit Team</button>
          <button class="delete-team-btn" data-team="${team._id}" style="margin-left:0.5em;padding:0.6em 1.2em;background:#e53935;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Delete Team</button>
          <ul style="margin-top:0.7em;">${rosterHtml}</ul>
        </div>
      `;

      const header = teamDiv.querySelector(".team-header");
      const rosterDiv = teamDiv.querySelector(".team-roster");
      header.addEventListener("click", () => toggleRoster(rosterDiv, header));
      header.addEventListener("keydown", (e) => {
        if (["Enter", " "].includes(e.key)) header.click();
      });

      if (expandTeamId && team._id === expandTeamId) toggleRoster(rosterDiv, header, true);
      teamInfoContent.appendChild(teamDiv);
    });
  }

  function toggleRoster(rosterDiv, header, forceOpen = false) {
    const isOpen = rosterDiv.style.display === "";
    document.querySelectorAll(".team-roster").forEach((el) => (el.style.display = "none"));
    document.querySelectorAll(".expand-arrow").forEach((el) => (el.innerHTML = "&#9654;"));
    if (!isOpen || forceOpen) {
      rosterDiv.style.display = "";
      header.querySelector(".expand-arrow").innerHTML = "&#9660;";
    }
  }

  // -------------------------
  // Team & Player Actions
  // -------------------------
  teamInfoContent.addEventListener("click", async (e) => {
    const target = e.target;
    const teamId = target.dataset.team;
    const playerId = target.dataset.player;

    if (target.classList.contains("add-player-btn")) await handlePlayerForm("add", teamId);
    if (target.classList.contains("edit-player-btn")) await handlePlayerForm("edit", teamId, playerId);
    if (target.classList.contains("delete-player-btn")) await deletePlayerConfirm(teamId, playerId);
    if (target.classList.contains("edit-team-btn")) await handleTeamForm("edit", teamId);
    if (target.classList.contains("delete-team-btn")) await deleteTeamConfirm(teamId);
    if (target.classList.contains("player-link")) showPlayerModal(teamId, playerId);
  });

  // -------------------------
  // Player Form Handler
  // -------------------------
  async function handlePlayerForm(type, teamId, playerId = null) {
    const team = teams.find((t) => t._id === teamId);
    let player = playerId ? team.roster.find((p) => p._id === playerId) : null;

    const html = `
      <h3 style="margin-bottom:1em;text-align:center;">${type === "add" ? "Add Player" : "Edit Player"}</h3>
      <form id="${type}-player-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
        ${[
          { label: "Name", name: "name", value: player?.name || "", type: "text", required: true },
          { label: "Position", name: "position", value: player?.position || "", type: "text" },
          { label: "Number", name: "number", value: player?.number || "", type: "number" },
          { label: "Height", name: "height", value: player?.height || "", type: "text" },
          { label: "Weight", name: "weight", value: player?.weight || "", type: "number" },
          { label: "Age", name: "age", value: player?.age || "", type: "number" },
          { label: "PPG", name: "ppg", value: player?.ppg || "", type: "number", step: "any" },
          { label: "FG%", name: "fg", value: player?.fg || "", type: "number", step: "any" },
          { label: "APG", name: "assists", value: player?.assists || "", type: "number", step: "any" },
          { label: "RPG", name: "rebounds", value: player?.rebounds || "", type: "number", step: "any" },
        ]
          .map(
            (f) =>
              `<label style="display:flex;flex-direction:column;font-weight:500;">${f.label}: <input name="${f.name}" value="${f.value}" ${f.required ? "required" : ""} style="padding:0.4em;margin-top:0.2em;" ${f.step ? `step="${f.step}"` : ""} type="${f.type}"></label>`
          )
          .join("")}
        <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">${type === "add" ? "Add" : "Save"}</button>
      </form>
    `;
    openModal(html);

    const form = modalContainer.querySelector(`#${type}-player-form`);
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const formData = Object.fromEntries(new FormData(form));
      ["number", "age", "ppg", "fg", "assists", "rebounds", "weight"].forEach((f) => {
        if (formData[f] !== undefined) formData[f] = Number(formData[f]);
      });
      try {
        if (type === "add") await api.addPlayer(teamId, formData);
        else await api.updatePlayer(teamId, playerId, { ...player, ...formData });
        teams = await api.getTeams();
        rerenderTeams(teamId);
        closeModal();
      } catch (err) {
        console.error(err);
        alert("Failed to save player");
      }
    };
  }

  // -------------------------
  // Team Form Handler
  // -------------------------
  async function handleTeamForm(type, teamId = null) {
    const team = type === "edit" ? teams.find((t) => t._id === teamId) : null;
    const html = `
      <h3 style="margin-bottom:1em;text-align:center;">${type === "edit" ? "Edit Team" : "Add Team"}</h3>
      <form id="${type}-team-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
        <label style="display:flex;flex-direction:column;font-weight:500;">Team Name: <input name="name" value="${team?.name || ""}" required style="padding:0.4em;margin-top:0.2em;"></label>
        <label style="display:flex;flex-direction:column;font-weight:500;">Season Year: <input name="year" type="number" value="${team?.year || ""}" required style="padding:0.4em;margin-top:0.2em;"></label>
        <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">Save</button>
      </form>
    `;
    openModal(html);

    const form = modalContainer.querySelector(`#${type}-team-form`);
    form.onsubmit = async (ev) => {
      ev.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.year = Number(data.year);
      data.roster = team?.roster || [];
      try {
        if (type === "edit") await api.updateTeam(teamId, data);
        else await api.createTeam(data);
        teams = await api.getTeams();
        rerenderTeams();
        closeModal();
        renderSeasonPage();
      } catch (err) {
        console.error(err);
        alert("Failed to save team");
      }
    };
  }

  // -------------------------
  // Delete Handlers
  // -------------------------
  async function deletePlayerConfirm(teamId, playerId) {
    if (!confirm("Delete this player?")) return;
    try {
      await api.deletePlayer(teamId, playerId);
      teams = await api.getTeams();
      rerenderTeams(teamId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete player");
    }
  }

  async function deleteTeamConfirm(teamId) {
    if (!confirm("Delete this team?")) return;
    try {
      await api.deleteTeam(teamId);
      teams = await api.getTeams();
      rerenderTeams();
      renderSeasonPage();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team");
    }
  }

  // -------------------------
  // Player Modal View
  // -------------------------
  function showPlayerModal(teamId, playerId) {
    const team = teams.find((t) => t._id === teamId);
    const player = team?.roster.find((p) => p._id === playerId);
    if (!player) return;

    const html = `
      <h3>${player.name}</h3>
      <ul class="player-stats">
        <li><strong>Position:</strong> ${player.position}</li>
        <li><strong>Height:</strong> ${player.height}</li>
        <li><strong>Weight:</strong> ${player.weight}</li>
        <li><strong>Age:</strong> ${player.age}</li>
        <li><strong>PPG:</strong> ${player.ppg}</li>
        <li><strong>FG%:</strong> ${player.fg}</li>
        <li><strong>APG:</strong> ${player.assists}</li>
        <li><strong>RPG:</strong> ${player.rebounds}</li>
      </ul>
    `;
    openModal(html);
  }

  // -------------------------
  // Season Page
  // -------------------------
  const seasonSection = document.getElementById("season");
  const seasonSelect = document.getElementById("season-page-select");
  const seasonInfoBlock = document.getElementById("season-info-block");

  function renderSeasonPage() {
    if (!seasonSelect || !seasonInfoBlock) return;
    const seasons = [...new Set(teams.map((t) => t.year))].sort((a, b) => b - a);
    if (seasons.length === 0) {
      seasonInfoBlock.innerHTML = "<p>No seasons available.</p>";
      return;
    }
    seasonSelect.innerHTML = seasons.map((s) => `<option value="${s}">${s}</option>`).join("");
    let selected = seasonSelect.value || seasons[0];
    seasonSelect.value = selected;

    const filtered = teams.filter((t) => t.year == selected);
    let html = `<h3>Teams for Season ${selected}</h3>`;
    html += filtered.length
      ? `<ul style="margin-top:1em;">${filtered.map((t) => `<li><strong>${t.name}</strong> (${t.city || ""}) - Year: ${t.year} [${t.roster.length} players]</li>`).join("")}</ul>`
      : "<p>No teams for this season.</p>";

    seasonInfoBlock.innerHTML = html;
  }

  if (seasonSelect) seasonSelect.addEventListener("change", renderSeasonPage);
  document.getElementById("nav-season")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("season");
    renderSeasonPage();
  });

  // -------------------------
  // Add Team Button
  // -------------------------
  document.getElementById("add-team-btn")?.addEventListener("click", () => handleTeamForm("add"));

  // -------------------------
  // Init
  // -------------------------
  async function init() {
    try {
      teams = await api.getTeams();
      rerenderTeams();
      renderSeasonPage();
      showSection(lastSection);
    } catch (err) {
      console.error("Failed to load teams:", err);
    }
  }

  init();
});
