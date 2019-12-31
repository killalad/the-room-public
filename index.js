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
		secret: 'secret',
		resave: true,
		saveUninitialized: true,
	}),
)
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/auth', function(request, response) {
	var username = request.body.username
	var password = request.body.password
	if (username == process.env.USERNAME && password == process.env.PASSWORD) {
		request.session.loggedin = true
		response.redirect('/')
	} else {
		response.send('Please enter Username and Password!')
	}
})
app.get('/login', function(request, response) {
	response.sendFile(__dirname + '/public/login.html')
})

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/public/index.html')
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
