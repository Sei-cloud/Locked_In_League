// public/js/script.js (or js/script.js)
document.addEventListener("DOMContentLoaded", function () {
  // Hide season page by default unless lastSection is 'season'
  const seasonSection = document.getElementById('season');
  if (seasonSection) {
    seasonSection.style.display = (localStorage.getItem("lockedInLeagueLastSection") === "season") ? "" : "none";
  }
  // --- Season Page Logic ---
  const seasonPageSelect = document.getElementById('season-page-select');
  const seasonInfoBlock = document.getElementById('season-info-block');

  function renderSeasonPage() {
    if (!seasonPageSelect || !seasonInfoBlock) return;
    // Get all unique seasons
    const seasons = [...new Set(teams.map(t => t.seasonYear))].sort((a,b) => b-a);
    seasonPageSelect.innerHTML = seasons.map(season => `<option value="${season}">${season}</option>`).join('');
    let selected = seasonPageSelect.value || seasons[0];
    seasonPageSelect.value = selected;
    // Filter teams by selected season
    const filteredTeams = teams.filter(t => t.seasonYear == selected);
    let html = `<h3>Teams for Season ${selected}</h3>`;
    if (filteredTeams.length === 0) {
      html += '<p>No teams for this season.</p>';
    } else {
      html += '<ul style="margin-top:1em;">';
      filteredTeams.forEach(team => {
        html += `<li><strong>${team.name}</strong> (${team.city || ''}) - Coach: ${team.coach || ''} [${team.roster.length} players]</li>`;
      });
      html += '</ul>';
    }
    seasonInfoBlock.innerHTML = html;
  }

  if (seasonPageSelect) {
    seasonPageSelect.addEventListener('change', renderSeasonPage);
  }

  // --- Navigation logic for season page ---
  const navSeason = document.getElementById('nav-season');
  if (navSeason) {
    navSeason.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
      document.getElementById('season').style.display = '';
      renderSeasonPage();
      localStorage.setItem("lockedInLeagueLastSection", "season");
    });
  }
  // Add Team button and modal logic
  document.getElementById('add-team-btn').addEventListener('click', () => {
    const modal = document.getElementById('player-modal');
    if (!modal) return;
    const container = modal.querySelector('.player-stats');
    container.innerHTML = `
      <h3 style="margin-bottom:1em;text-align:center;">Add Team</h3>
      <form id="add-team-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
        <label style="display:flex;flex-direction:column;font-weight:500;">Team Name: <input name="name" required style="padding:0.4em;margin-top:0.2em;"></label>
        <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">Add</button>
      </form>
    `;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const form = container.querySelector('#add-team-form');
    form.onsubmit = async function(ev) {
      ev.preventDefault();
      const formData = new FormData(form);
      const payload = { name: formData.get('name'), roster: [] };
      try {
        await createTeam(payload);
        teams = await fetchTeams();
        rerenderTeamInfo();
        modal.style.display = 'none';
        document.body.style.overflow = '';
      } catch (err) { console.error(err); alert('Failed to add team'); }
    };
  });
  const API_BASE = (window.location.hostname === 'localhost') ? 'http://localhost:4000' : ''; // adjust if hosted elsewhere

  const sections = ["boxscore","roster","team-info","player-info","league-info"];
  let lastSection = localStorage.getItem("lockedInLeagueLastSection") || "boxscore";
  sections.forEach(sec => document.getElementById(sec).style.display = (sec === lastSection) ? "" : "none");
  sections.forEach(section => {
    document.getElementById("nav-" + section)?.addEventListener("click", function(e) {
      e.preventDefault();
      sections.forEach(sec => document.getElementById(sec).style.display = (sec === section) ? "" : "none");
      // Hide season page content if navigating away
      if (section !== "season") {
        document.getElementById('season').style.display = 'none';
      }
      localStorage.setItem("lockedInLeagueLastSection", section);
    });
  });

  // fetch helpers
  async function fetchTeams() {
  const res = await fetch(`${API_BASE}/api/teams`);
    if (!res.ok) throw new Error('Failed to load teams');
    return await res.json();
  }
  async function createTeam(team) {
  const res = await fetch(`${API_BASE}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team)
    });
    return res.json();
  }
  async function updateTeam(teamId, payload) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    return res.json();
  }
  async function deleteTeam(teamId) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}`, { method: 'DELETE' });
    return res.json();
  }
  async function addPlayerToTeam(teamId, player) {
  const res = await fetch(`${API_BASE}/api/teams/${teamId}/players`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(player)
    });
    return res.json();
  }
  async function updatePlayer(teamId, playerId, payload) {
    const res = await fetch(`${API_BASE}/api/teams/${teamId}/players/${playerId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    return res.json();
  }
  async function deletePlayer(teamId, playerId) {
    const res = await fetch(`${API_BASE}/api/teams/${teamId}/players/${playerId}`, {
      method: 'DELETE'
    });
    return res.json();
  }

  // in-memory teams loaded from server
  let teams = [];

  const teamInfoContent = document.getElementById("team-info-content");

  // reusable rerender function (auto-expands team if openTeamId provided)
  function rerenderTeamInfo(openTeamId = null) {
    teamInfoContent.innerHTML = "";
    teams.forEach(team => {
      const teamDiv = document.createElement('div');
      teamDiv.className = 'team-block';
      teamDiv.innerHTML = `
        <div class="team-header" tabindex="0" style="display:flex;align-items:center;justify-content:space-between;padding:0.5em 0.7em;">
          <strong style="flex:1;text-align:left;">${team.name}</strong>
          <span class="expand-arrow" style="margin-left:auto;font-size:1.2em;cursor:pointer;">&#9654;</span>
        </div>
        <div class="team-roster" style="display:none;">
          <button class="add-player-btn" data-team="${team._id}" style="margin-bottom:0.7em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Add Player</button>
          <button class="edit-team-btn" data-team="${team._id}" style="margin-left:0.5em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Edit Team</button>
          <button class="delete-team-btn" data-team="${team._id}" style="margin-left:0.5em;padding:0.6em 1.2em;background:#e53935;color:#fff;border:none;border-radius:4px;font-size:0.95em;cursor:pointer;">Delete Team</button>
          <ul style="margin-top:0.7em;">
            ${team.roster.map((p, idx) => `
              <li style="display:flex;align-items:center;gap:0.5rem;">
                <span class="player-link" tabindex="0" data-team="${team._id}" data-player="${p._id}">#${p.number} ${p.name} - ${p.position}</span>
                <button class="edit-player-btn" data-team="${team._id}" data-player="${p._id}" style="font-size:0.9em;padding:0.1em 0.5em;">Edit</button>
                <button class="delete-player-btn" data-team="${team._id}" data-player="${p._id}" style="font-size:0.9em;padding:0.1em 0.5em;background:#e53935;color:#fff;">Delete</button>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      const header = teamDiv.querySelector('.team-header');
      const rosterDiv = teamDiv.querySelector('.team-roster');

      header.addEventListener('click', () => {
        const isOpen = rosterDiv.style.display === "";
        document.querySelectorAll('.team-roster').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.expand-arrow').forEach(el => el.innerHTML = '&#9654;');
        if (!isOpen) {
          rosterDiv.style.display = '';
          header.querySelector('.expand-arrow').innerHTML = '&#9660;';
        }
      });
      header.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') header.click(); });

      // auto-expand if requested
      if (openTeamId && team._id === openTeamId) {
        rosterDiv.style.display = '';
        header.querySelector('.expand-arrow').innerHTML = '&#9660;';
      }

      teamInfoContent.appendChild(teamDiv);
    });
  }

  // initial load from server
  async function init() {
    try {
      teams = await fetchTeams();
      rerenderTeamInfo();
      renderBoxscore();
    } catch (err) {
      console.error('Failed to load teams:', err);
      // optionally fallback to a seed route or show message
    }
  }

  // Boxscore rendering (simple mock)
  function renderBoxscore() {
    const boxscoreContent = document.getElementById('boxscore-content');
    if (!boxscoreContent || teams.length < 2) return;
    const t1 = teams[0], t2 = teams[1];
    boxscoreContent.innerHTML = `
      <h3>${t1.name} vs ${t2.name}</h3>
      <table border="1" cellpadding="5">
        <tr><th>Player</th><th>PTS</th></tr>
        ${t1.roster.slice(0,5).map(p => `<tr><td>${p.name}</td><td>${Math.floor(Math.random()*20)}</td></tr>`).join('')}
      </table>
      <br>
      <table border="1" cellpadding="5">
        <tr><th>Player</th><th>PTS</th></tr>
        ${t2.roster.slice(0,5).map(p => `<tr><td>${p.name}</td><td>${Math.floor(Math.random()*20)}</td></tr>`).join('')}
      </table>
    `;
  }

  // helper: find team index by id
  function findTeamIndexById(id) { return teams.findIndex(t => t._id === id); }

  // event delegation for team interactions (add/edit/delete)
  teamInfoContent.addEventListener('click', async (e) => {
    if (e.target.classList.contains('add-player-btn')) {
      const teamId = e.target.getAttribute('data-team');
      const modal = document.getElementById('player-modal');
      if (!modal) return;
      const container = modal.querySelector('.player-stats');
      container.innerHTML = `
        <h3 style="margin-bottom:1em;text-align:center;">Add Player</h3>
        <form id="add-player-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
          <label style="display:flex;flex-direction:column;font-weight:500;">Name: <input name="name" required style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Position: <input name="position" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Number: <input name="number" type="number" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Height: <input name="height" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Weight: <input name="weight" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Age: <input name="age" type="number" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">PPG: <input name="ppg" type="number" step="any" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">FG%: <input name="fg" type="number" step="any" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">APG: <input name="assists" type="number" step="any" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">RPG: <input name="rebounds" type="number" step="any" style="padding:0.4em;margin-top:0.2em;"></label>
          <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">Add</button>
        </form>
      `;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const form = container.querySelector('#add-player-form');
      form.onsubmit = async function(ev) {
        ev.preventDefault();
        const formData = new FormData(form);
        const payload = {};
        for (const [key, value] of formData.entries()) {
          payload[key] = value;
        }
        // convert number fields
        ['number','age','ppg','fg','assists','rebounds','weight'].forEach(f => {
          if (payload[f] !== undefined) payload[f] = Number(payload[f]);
        });
        try {
          await addPlayerToTeam(teamId, payload);
          teams = await fetchTeams();
          rerenderTeamInfo(teamId);
          modal.style.display = 'none';
          document.body.style.overflow = '';
        } catch (err) { console.error(err); alert('Failed to add player'); }
      };
    }

    if (e.target.classList.contains('delete-player-btn')) {
      if (!confirm('Delete this player?')) return;
      const teamId = e.target.getAttribute('data-team');
      const playerId = e.target.getAttribute('data-player');
      try {
        await deletePlayer(teamId, playerId);
        teams = await fetchTeams();
        rerenderTeamInfo(teamId);
      } catch (err) { console.error(err); alert('Failed to delete player'); }
    }

    if (e.target.classList.contains('edit-player-btn')) {
      const teamId = e.target.getAttribute('data-team');
      const playerId = e.target.getAttribute('data-player');
      const team = teams.find(t => t._id === teamId);
      const player = team.roster.find(p => p._id === playerId);
      const modal = document.getElementById('player-modal');
      if (!modal) return;
      const container = modal.querySelector('.player-stats');
      container.innerHTML = `
        <h3 style="margin-bottom:1em;text-align:center;">Edit Player</h3>
        <form id="edit-player-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
          <label style="display:flex;flex-direction:column;font-weight:500;">Name: <input name="name" value="${player.name}" required style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Position: <input name="position" value="${player.position}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Number: <input name="number" type="number" value="${player.number}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Height: <input name="height" value="${player.height}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Weight: <input name="weight" value="${player.weight}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">Age: <input name="age" type="number" value="${player.age}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">PPG: <input name="ppg" type="number" step="any" value="${player.ppg}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">FG%: <input name="fg" type="number" step="any" value="${player.fg}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">APG: <input name="assists" type="number" step="any" value="${player.assists}" style="padding:0.4em;margin-top:0.2em;"></label>
          <label style="display:flex;flex-direction:column;font-weight:500;">RPG: <input name="rebounds" type="number" step="any" value="${player.rebounds}" style="padding:0.4em;margin-top:0.2em;"></label>
          <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">Save</button>
        </form>
      `;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const form = container.querySelector('#edit-player-form');
      form.onsubmit = async function(ev) {
        ev.preventDefault();
        const formData = new FormData(form);
        const payload = {};
        for (const [key, value] of formData.entries()) {
          payload[key] = value;
        }
        // convert number fields
        ['number','age','ppg','fg','assists','rebounds','weight'].forEach(f => {
          if (payload[f] !== undefined) payload[f] = Number(payload[f]);
        });
        try {
          await updatePlayer(teamId, playerId, { ...player, ...payload });
          teams = await fetchTeams();
          rerenderTeamInfo(teamId);
          modal.style.display = 'none';
          document.body.style.overflow = '';
        } catch (err) { console.error(err); alert('Failed to update player'); }
      };
    }

    if (e.target.classList.contains('edit-team-btn')) {
      const teamId = e.target.getAttribute('data-team');
      const team = teams.find(t => t._id === teamId);
      const modal = document.getElementById('player-modal');
      if (!modal) return;
      const container = modal.querySelector('.player-stats');
      container.innerHTML = `
        <h3 style="margin-bottom:1em;text-align:center;">Edit Team</h3>
        <form id="edit-team-form" style="display:flex;flex-direction:column;gap:0.7em;max-width:350px;margin:auto;">
          <label style="display:flex;flex-direction:column;font-weight:500;">Team Name: <input name="name" value="${team.name}" required style="padding:0.4em;margin-top:0.2em;"></label>
          <button type="submit" style="margin-top:1em;padding:0.6em 1.2em;background:#1976d2;color:#fff;border:none;border-radius:4px;font-size:1em;cursor:pointer;">Save</button>
        </form>
      `;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const form = container.querySelector('#edit-team-form');
      form.onsubmit = async function(ev) {
        ev.preventDefault();
        const formData = new FormData(form);
        const payload = { ...team, name: formData.get('name') };
        try {
          await updateTeam(teamId, payload);
          teams = await fetchTeams();
          rerenderTeamInfo(teamId);
          modal.style.display = 'none';
          document.body.style.overflow = '';
        } catch (err) { console.error(err); alert('Failed to update team'); }
      };
    }

    if (e.target.classList.contains('delete-team-btn')) {
      const teamId = e.target.getAttribute('data-team');
      if (!confirm('Delete this team?')) return;
      try {
        await deleteTeam(teamId);
        teams = await fetchTeams();
        rerenderTeamInfo(); // nothing expanded
      } catch (err) { console.error(err); alert('Failed to delete team'); }
    }
  });

  // click on player to show modal (re-uses your modal approach)
  teamInfoContent.addEventListener('click', (e) => {
    if (e.target.classList.contains('player-link')) {
      const teamId = e.target.getAttribute('data-team');
      const playerId = e.target.getAttribute('data-player');
      const team = teams.find(t => t._id === teamId);
      const player = team?.roster.find(p => p._id === playerId);
      if (!player) return;
      // populate and show your modal (assumes #player-modal exists in DOM)
      const modal = document.getElementById('player-modal');
      if (!modal) return;
      const container = modal.querySelector('.player-stats');
      container.innerHTML = `
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
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  });

  // close player modal when clicking the close button or outside modal content
  document.getElementById('close-player-modal').addEventListener('click', () => {
    const modal = document.getElementById('player-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  });
  document.getElementById('player-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.style.display = 'none';
      document.body.style.overflow = '';
    }
  });

  // expose init
  init();
});
