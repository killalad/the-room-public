const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const crypto = require('./encryption')

require('dotenv').config()

server.listen(process.env.LOCAL_PORT)

app.use(express.static(__dirname + '/public'))

app.use(
	session({
		secret: 'sad1eez0phu6Ab6iethaeT8ua4Tepei6',
		resave: false,
		saveUninitialized: false,
	}),
)
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/auth', function(request, response) {
	var username = request.body.username
	var password = request.body.password
	if (username == process.env.USERNAME && password == process.env.PASSWORD) {
		request.session.loggedin = true
	}
	response.redirect('/')
})
app.get('/', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(__dirname + '/public/index.html')
	} else {
		response.sendFile(__dirname + '/public/login.html')
	}
})

io.on('connection', function(socket) {
	socket.on('send-data', function(data) {
		data = JSON.parse(crypto.decrypt(data))
		socket.broadcast.emit('send-data', data)
	})
	socket.on('request-data', function() {
		socket.broadcast.emit('request-data')
	})
	socket.on('toggle', function(data) {
		data = crypto.encrypt(JSON.stringify(data))
		socket.broadcast.emit('toggle', data)
		socket.broadcast.emit('request-data')
	})
})
