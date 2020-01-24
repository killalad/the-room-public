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
		secret: process.env.SESSION,
		resave: false,
		saveUninitialized: false,
		cookie: { secure: true },
	}),
)
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/auth', function(req, res) {
	if (crypto.hash(req.body.password) == process.env.PASSWORD) {
		req.session.authenticated = true
		res.redirect('/')
	} else {
		res.redirect('/login')
	}
})
app.get(
	'/',
	function(req, res, next) {
		if (req.session && req.session.authenticated) return next()
		else return res.redirect('/login')
	},
	function(req, res) {
		res.sendFile(__dirname + '/pages/index.html')
	},
)
app.get(
	'/login',
	function(req, res, next) {
		if (req.session && req.session.authenticated) return res.redirect('/')
		else return next()
	},
	function(req, res) {
		res.sendFile(__dirname + '/pages/login.html')
	},
)

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
