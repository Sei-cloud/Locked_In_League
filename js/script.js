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
});
