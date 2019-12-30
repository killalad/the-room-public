const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

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
app.use(bodyParser.json())

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/public/login.html'))
})
app.post('/auth', function(request, response) {
	var username = request.body.username
	var password = request.body.password
	if (username == process.env.USERNAME && password == process.env.PASSWORD) {
		request.session.loggedin = true
		response.redirect('/home')
	} else {
		response.send('Please enter Username and Password!')
	}
})
app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(__dirname + '/public/index.html')
	} else {
		response.send('Please login to view this page!')
	}
})

io.on('connection', function(socket) {
	socket.on('send-data', function(data) {
		socket.broadcast.emit('send-data', data)
	})
	socket.on('request-data', function() {
		socket.broadcast.emit('request-data')
	})
	socket.on('toggle', function(data) {
		socket.broadcast.emit('toggle', data)
		socket.broadcast.emit('request-data')
	})
})
