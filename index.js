const express = require('express')
const app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

require('dotenv').config()

server.listen(process.env.LOCAL_PORT)

app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'))

io.on('connection', function(socket) {
	socket.on('send-data', function(data) {
		socket.broadcast.emit('send-data', data)
	})
	socket.on('request-data', function() {
		socket.broadcast.emit('request-data')
	})
	socket.on('toggle', function(data) {
		socket.broadcast.emit('toggle', data)
	})
})
