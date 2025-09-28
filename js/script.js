document.addEventListener('DOMContentLoaded', function() {
		const sections = [
			'boxscore',
			'roster',
			'team-info',
			'player-info',
			'league-info'
		];
		sections.forEach(section => {
			document.getElementById('nav-' + section)?.addEventListener('click', function(e) {
				e.preventDefault();
				sections.forEach(sec => {
					document.getElementById(sec).style.display = (sec === section) ? '' : 'none';
				});
			});
		});

		// Persistent teams and rosters
		function getDefaultTeams() {
			return Array.from({length: 14}, (_, i) => ({
				id: i+1,
				name: `Team ${String.fromCharCode(65+i)}`,
				city: `City ${i+1}`,
				coach: `Coach ${String.fromCharCode(65+i)}`,
				roster: Array.from({length: 10}, (_, j) => {
					const base = i*10 + j;
					return {
						name: `Player ${j+1} (${String.fromCharCode(65+i)})`,
						position: ['G', 'F', 'C'][j%3],
						number: j+1,
						height: `${180 + (j%5)*3} cm`,
						weight: `${75 + (j%7)*2} kg`,
						age: 19 + (j%5),
						ppg: (8 + (base%10) + Math.random()*5).toFixed(1),
						fg: (40 + (base%20) + Math.random()*10).toFixed(1),
						assists: (2 + (base%5) + Math.random()*2).toFixed(1),
						rebounds: (3 + (base%6) + Math.random()*2).toFixed(1)
					}
				})
			}));
		}
		function saveTeams() {
			localStorage.setItem('lockedInLeagueTeams', JSON.stringify(teams));
		}
		function loadTeams() {
			const data = localStorage.getItem('lockedInLeagueTeams');
			if (data) return JSON.parse(data);
			return getDefaultTeams();
		}
		let teams = loadTeams();

		// Render teams in Team Info section
		const teamInfoContent = document.getElementById('team-info-content');
		teamInfoContent.innerHTML = '';
		teams.forEach(team => {
			const teamDiv = document.createElement('div');
			teamDiv.className = 'team-block';
			teamDiv.innerHTML = `
				<div class="team-header" tabindex="0">
					<strong>${team.name}</strong> <span class="team-city">(${team.city})</span> - Coach: ${team.coach}
					<span class="expand-arrow">&#9654;</span>
				</div>
				<div class="team-roster" style="display:none;"></div>
			`;
			// Roster rendering
			const rosterDiv = teamDiv.querySelector('.team-roster');
			rosterDiv.innerHTML = `
				<button class="add-player-btn" data-team="${team.id}" style="margin-bottom:0.7em;font-size:0.95em;">Add Player</button>
				<ul>${team.roster.map((player, idx) =>
					`<li style="display:flex;align-items:center;gap:0.5rem;">
						<span class="player-link" tabindex="0" data-team="${team.id}" data-player="${idx}">#${player.number} ${player.name} - ${player.position}</span>
						<button class="edit-player-btn" data-team="${team.id}" data-player="${idx}" style="font-size:0.9em;padding:0.1em 0.5em;">Edit</button>
						<button class="delete-player-btn" data-team="${team.id}" data-player="${idx}" style="font-size:0.9em;padding:0.1em 0.5em;background:#e53935;">Delete</button>
					</li>`
				).join('')}</ul>
			`;
	// Add Player modal
	let addModal = document.getElementById('add-player-modal');
	if (!addModal) {
		addModal = document.createElement('div');
		addModal.id = 'add-player-modal';
		addModal.innerHTML = `
			<div class="modal-bg"></div>
			<div class="modal-content">
				<span class="modal-close" tabindex="0">&times;</span>
				<div id="add-player-form-container"></div>
			</div>
		`;
		document.body.appendChild(addModal);
	}
	function showAddModal(teamIdx) {
		const form = `
			<h3>Add Player</h3>
			<form id="add-player-form">
				<label>Name: <input name="name" required></label><br>
				<label>Position: <input name="position" required></label><br>
				<label>Number: <input name="number" type="number" min="0" required></label><br>
				<label>Height: <input name="height" required></label><br>
				<label>Weight: <input name="weight" required></label><br>
				<label>Age: <input name="age" type="number" min="0" required></label><br>
				<label>PPG: <input name="ppg" type="number" step="0.1" required></label><br>
				<label>FG%: <input name="fg" type="number" step="0.1" required></label><br>
				<label>Assists Avg: <input name="assists" type="number" step="0.1" required></label><br>
				<label>Rebounds Avg: <input name="rebounds" type="number" step="0.1" required></label><br>
				<button type="submit">Add</button>
			</form>
		`;
		document.getElementById('add-player-form-container').innerHTML = form;
		addModal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
		document.getElementById('add-player-form').onsubmit = function(e) {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(this).entries());
			teams[teamIdx].roster.push(data);
			saveTeams();
			addModal.style.display = 'none';
			document.body.style.overflow = '';
			// Rerender team info
			teamInfoContent.innerHTML = '';
			teams.forEach((team, i) => {
				const teamDiv = document.createElement('div');
				teamDiv.className = 'team-block';
				teamDiv.innerHTML = `
					<div class="team-header" tabindex="0">
						<strong>${team.name}</strong> <span class="team-city">(${team.city})</span> - Coach: ${team.coach}
						<span class="expand-arrow">&#9654;</span>
					</div>
					<div class="team-roster" style="display:none;"></div>
				`;
				const rosterDiv = teamDiv.querySelector('.team-roster');
				rosterDiv.innerHTML = `
					<button class=\"add-player-btn\" data-team=\"${team.id}\" style=\"margin-bottom:0.7em;font-size:0.95em;\">Add Player</button>
					<ul>${team.roster.map((player, idx) =>
						`<li style=\"display:flex;align-items:center;gap:0.5rem;\">
							<span class=\"player-link\" tabindex=\"0\" data-team=\"${team.id}\" data-player=\"${idx}\">#${player.number} ${player.name} - ${player.position}</span>
							<button class=\"edit-player-btn\" data-team=\"${team.id}\" data-player=\"${idx}\" style=\"font-size:0.9em;padding:0.1em 0.5em;\">Edit</button>
							<button class=\"delete-player-btn\" data-team=\"${team.id}\" data-player=\"${idx}\" style=\"font-size:0.9em;padding:0.1em 0.5em;background:#e53935;\">Delete</button>
						</li>`
					).join('')}</ul>
				`;
				const header = teamDiv.querySelector('.team-header');
				header.addEventListener('click', function() {
					const isOpen = rosterDiv.style.display === '';
					document.querySelectorAll('.team-roster').forEach(el => el.style.display = 'none');
					document.querySelectorAll('.expand-arrow').forEach(el => el.innerHTML = '&#9654;');
					if (!isOpen) {
						rosterDiv.style.display = '';
						header.querySelector('.expand-arrow').innerHTML = '&#9660;';
					}
				});
				header.addEventListener('keydown', function(e) {
					if (e.key === 'Enter' || e.key === ' ') header.click();
				});
				teamInfoContent.appendChild(teamDiv);
			});
		};
	}
	function hideAddModal() {
		addModal.style.display = 'none';
		document.body.style.overflow = '';
	}
	addModal.querySelector('.modal-bg').addEventListener('click', hideAddModal);
	addModal.querySelector('.modal-close').addEventListener('click', hideAddModal);
	addModal.querySelector('.modal-close').addEventListener('keydown', function(e) {
		if (e.key === 'Enter' || e.key === ' ') hideAddModal();
	});
	document.addEventListener('keydown', function(e) {
		if (addModal.style.display === 'flex' && e.key === 'Escape') hideAddModal();
	});

	// Delete Player modal
	let deleteModal = document.getElementById('delete-player-modal');
	if (!deleteModal) {
		deleteModal = document.createElement('div');
		deleteModal.id = 'delete-player-modal';
		deleteModal.innerHTML = `
			<div class="modal-bg"></div>
			<div class="modal-content">
				<span class="modal-close" tabindex="0">&times;</span>
				<div id="delete-player-form-container"></div>
			</div>
		`;
		document.body.appendChild(deleteModal);
	}
	function showDeleteModal(teamIdx, playerIdx) {
		const player = teams[teamIdx].roster[playerIdx];
		const form = `
			<h3>Delete Player</h3>
			<p>Are you sure you want to delete <strong>${player.name}</strong>?</p>
			<button id="confirm-delete-player">Delete</button>
			<button id="cancel-delete-player" type="button">Cancel</button>
		`;
		document.getElementById('delete-player-form-container').innerHTML = form;
		deleteModal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
		document.getElementById('confirm-delete-player').onclick = function() {
			   teams[teamIdx].roster.splice(playerIdx, 1);
			   saveTeams();
			   deleteModal.style.display = 'none';
			   document.body.style.overflow = '';
			   // Rerender team info
			teamInfoContent.innerHTML = '';
			teams.forEach((team, i) => {
				const teamDiv = document.createElement('div');
				teamDiv.className = 'team-block';
				teamDiv.innerHTML = `
					<div class="team-header" tabindex="0">
						<strong>${team.name}</strong> <span class="team-city">(${team.city})</span> - Coach: ${team.coach}
						<span class="expand-arrow">&#9654;</span>
					</div>
					<div class="team-roster" style="display:none;"></div>
				`;
				const rosterDiv = teamDiv.querySelector('.team-roster');
				rosterDiv.innerHTML = `
					<button class=\"add-player-btn\" data-team=\"${team.id}\" style=\"margin-bottom:0.7em;font-size:0.95em;\">Add Player</button>
					<ul>${team.roster.map((player, idx) =>
						`<li style=\"display:flex;align-items:center;gap:0.5rem;\">
							<span class=\"player-link\" tabindex=\"0\" data-team=\"${team.id}\" data-player=\"${idx}\">#${player.number} ${player.name} - ${player.position}</span>
							<button class=\"edit-player-btn\" data-team=\"${team.id}\" data-player=\"${idx}\" style=\"font-size:0.9em;padding:0.1em 0.5em;\">Edit</button>
							<button class=\"delete-player-btn\" data-team=\"${team.id}\" data-player=\"${idx}\" style=\"font-size:0.9em;padding:0.1em 0.5em;background:#e53935;\">Delete</button>
						</li>`
					).join('')}</ul>
				`;
				const header = teamDiv.querySelector('.team-header');
				header.addEventListener('click', function() {
					const isOpen = rosterDiv.style.display === '';
					document.querySelectorAll('.team-roster').forEach(el => el.style.display = 'none');
					document.querySelectorAll('.expand-arrow').forEach(el => el.innerHTML = '&#9654;');
					if (!isOpen) {
						rosterDiv.style.display = '';
						header.querySelector('.expand-arrow').innerHTML = '&#9660;';
					}
				});
				header.addEventListener('keydown', function(e) {
					if (e.key === 'Enter' || e.key === ' ') header.click();
				});
				teamInfoContent.appendChild(teamDiv);
			});
		};
		document.getElementById('cancel-delete-player').onclick = function() {
			deleteModal.style.display = 'none';
			document.body.style.overflow = '';
		};
	}
	function hideDeleteModal() {
		deleteModal.style.display = 'none';
		document.body.style.overflow = '';
	}
	deleteModal.querySelector('.modal-bg').addEventListener('click', hideDeleteModal);
	deleteModal.querySelector('.modal-close').addEventListener('click', hideDeleteModal);
	deleteModal.querySelector('.modal-close').addEventListener('keydown', function(e) {
		if (e.key === 'Enter' || e.key === ' ') hideDeleteModal();
	});
	document.addEventListener('keydown', function(e) {
		if (deleteModal.style.display === 'flex' && e.key === 'Escape') hideDeleteModal();
	});

	// Delegate click for add and delete buttons
	teamInfoContent.addEventListener('click', function(e) {
		if (e.target.classList.contains('add-player-btn')) {
			const teamId = parseInt(e.target.getAttribute('data-team'));
			const teamIdx = teams.findIndex(t => t.id === teamId);
			showAddModal(teamIdx);
		}
		if (e.target.classList.contains('delete-player-btn')) {
			const teamId = parseInt(e.target.getAttribute('data-team'));
			const playerIdx = parseInt(e.target.getAttribute('data-player'));
			const teamIdx = teams.findIndex(t => t.id === teamId);
			showDeleteModal(teamIdx, playerIdx);
		}
	});
	// Player edit modal
	let editModal = document.getElementById('edit-player-modal');
	if (!editModal) {
		editModal = document.createElement('div');
		editModal.id = 'edit-player-modal';
		editModal.innerHTML = `
			<div class="modal-bg"></div>
			<div class="modal-content">
				<span class="modal-close" tabindex="0">&times;</span>
				<div id="edit-player-form-container"></div>
			</div>
		`;
		document.body.appendChild(editModal);
	}
	function showEditModal(teamIdx, playerIdx) {
		const player = teams[teamIdx].roster[playerIdx];
		const form = `
			<h3>Edit Player</h3>
			<form id="edit-player-form">
				<label>Name: <input name="name" value="${player.name}" required></label><br>
				<label>Position: <input name="position" value="${player.position}" required></label><br>
				<label>Number: <input name="number" type="number" min="0" value="${player.number}" required></label><br>
				<label>Height: <input name="height" value="${player.height}" required></label><br>
				<label>Weight: <input name="weight" value="${player.weight}" required></label><br>
				<label>Age: <input name="age" type="number" min="0" value="${player.age}" required></label><br>
				<label>PPG: <input name="ppg" type="number" step="0.1" value="${player.ppg}" required></label><br>
				<label>FG%: <input name="fg" type="number" step="0.1" value="${player.fg}" required></label><br>
				<label>Assists Avg: <input name="assists" type="number" step="0.1" value="${player.assists}" required></label><br>
				<label>Rebounds Avg: <input name="rebounds" type="number" step="0.1" value="${player.rebounds}" required></label><br>
				<button type="submit">Save</button>
			</form>
		`;
		document.getElementById('edit-player-form-container').innerHTML = form;
		editModal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
		document.getElementById('edit-player-form').onsubmit = function(e) {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(this).entries());
			   Object.assign(teams[teamIdx].roster[playerIdx], data);
			   saveTeams();
			   editModal.style.display = 'none';
			   document.body.style.overflow = '';
			   // Rerender team info
			teamInfoContent.innerHTML = '';
			teams.forEach((team, i) => {
				const teamDiv = document.createElement('div');
				teamDiv.className = 'team-block';
				teamDiv.innerHTML = `
					<div class="team-header" tabindex="0">
						<strong>${team.name}</strong> <span class="team-city">(${team.city})</span> - Coach: ${team.coach}
						<span class="expand-arrow">&#9654;</span>
					</div>
					<div class="team-roster" style="display:none;"></div>
				`;
				const rosterDiv = teamDiv.querySelector('.team-roster');
				rosterDiv.innerHTML = `<ul>${team.roster.map((player, idx) =>
					`<li style=\"display:flex;align-items:center;gap:0.5rem;\">
						<span class=\"player-link\" tabindex=\"0\" data-team=\"${team.id}\" data-player=\"${idx}\">#${player.number} ${player.name} - ${player.position}</span>
						<button class=\"edit-player-btn\" data-team=\"${team.id}\" data-player=\"${idx}\" style=\"font-size:0.9em;padding:0.1em 0.5em;\">Edit</button>
					</li>`
				).join('')}</ul>`;
				const header = teamDiv.querySelector('.team-header');
				header.addEventListener('click', function() {
					const isOpen = rosterDiv.style.display === '';
					document.querySelectorAll('.team-roster').forEach(el => el.style.display = 'none');
					document.querySelectorAll('.expand-arrow').forEach(el => el.innerHTML = '&#9654;');
					if (!isOpen) {
						rosterDiv.style.display = '';
						header.querySelector('.expand-arrow').innerHTML = '&#9660;';
					}
				});
				header.addEventListener('keydown', function(e) {
					if (e.key === 'Enter' || e.key === ' ') header.click();
				});
				teamInfoContent.appendChild(teamDiv);
			});
		};
	}
	function hideEditModal() {
		editModal.style.display = 'none';
		document.body.style.overflow = '';
	}
	editModal.querySelector('.modal-bg').addEventListener('click', hideEditModal);
	editModal.querySelector('.modal-close').addEventListener('click', hideEditModal);
	editModal.querySelector('.modal-close').addEventListener('keydown', function(e) {
		if (e.key === 'Enter' || e.key === ' ') hideEditModal();
	});
	document.addEventListener('keydown', function(e) {
		if (editModal.style.display === 'flex' && e.key === 'Escape') hideEditModal();
	});

	// Delegate click for edit buttons
	teamInfoContent.addEventListener('click', function(e) {
		if (e.target.classList.contains('edit-player-btn')) {
			const teamId = parseInt(e.target.getAttribute('data-team'));
			const playerIdx = parseInt(e.target.getAttribute('data-player'));
			const teamIdx = teams.findIndex(t => t.id === teamId);
			showEditModal(teamIdx, playerIdx);
		}
	});
			// Expand/collapse logic
			const header = teamDiv.querySelector('.team-header');
			header.addEventListener('click', function() {
				const isOpen = rosterDiv.style.display === '';
				document.querySelectorAll('.team-roster').forEach(el => el.style.display = 'none');
				document.querySelectorAll('.expand-arrow').forEach(el => el.innerHTML = '&#9654;');
				if (!isOpen) {
					rosterDiv.style.display = '';
					header.querySelector('.expand-arrow').innerHTML = '&#9660;';
				}
			});
			header.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') header.click();
			});
			teamInfoContent.appendChild(teamDiv);
		});

		// Player info popup/modal
		let playerModal = document.getElementById('player-modal');
		if (!playerModal) {
			playerModal = document.createElement('div');
			playerModal.id = 'player-modal';
			playerModal.innerHTML = `
				<div class="modal-bg"></div>
				<div class="modal-content">
					<span class="modal-close" tabindex="0">&times;</span>
					<div id="modal-player-details"></div>
				</div>
			`;
			document.body.appendChild(playerModal);
		}
		function showPlayerModal(player) {
			const details = `
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
			document.getElementById('modal-player-details').innerHTML = details;
			playerModal.style.display = 'flex';
			document.body.style.overflow = 'hidden';
		}
		function hidePlayerModal() {
			playerModal.style.display = 'none';
			document.body.style.overflow = '';
		}
		playerModal.querySelector('.modal-bg').addEventListener('click', hidePlayerModal);
		playerModal.querySelector('.modal-close').addEventListener('click', hidePlayerModal);
		playerModal.querySelector('.modal-close').addEventListener('keydown', function(e) {
			if (e.key === 'Enter' || e.key === ' ') hidePlayerModal();
		});
		document.addEventListener('keydown', function(e) {
			if (playerModal.style.display === 'flex' && e.key === 'Escape') hidePlayerModal();
		});

		// Delegate click for player links
		teamInfoContent.addEventListener('click', function(e) {
			if (e.target.classList.contains('player-link')) {
				const teamId = parseInt(e.target.getAttribute('data-team'));
				const playerIdx = parseInt(e.target.getAttribute('data-player'));
				const team = teams.find(t => t.id === teamId);
				if (team) {
					const player = team.roster[playerIdx];
					showPlayerModal(player);
				}
			}
		});
		teamInfoContent.addEventListener('keydown', function(e) {
			if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('player-link')) {
				e.target.click();
			}
		});
});
