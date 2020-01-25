let socket = io('http://localhost?token=123')
let toggle = {
	mainLight: document.getElementById('mainLightToggle'),
	tableLight: document.getElementById('tableLightToggle'),
}
socket.emit('request-data')
socket.on('send-data', function(data) {
	for (const key in toggle) {
		if (toggle.hasOwnProperty(key)) {
			toggle[key].checked = data[key]
		}
	}
})

toggle.mainLight.addEventListener('click', () => {
	socket.emit('toggle', { type: 'mainLight', value: toggle.mainLight.checked })
})
toggle.tableLight.addEventListener('click', () => {
	socket.emit('toggle', { type: 'tableLight', value: toggle.tableLight.checked })
})
