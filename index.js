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
		resave: true,
		saveUninitialized: true,
	}),
)
app.use(bodyParser.urlencoded({ extended: true }))

function auth(req, res, next) {
	if (req.session && req.session.authenticated) return next()
	else return res.redirect('/login')
}

app.post('/auth', function(req, res) {
	if (req.body.password == process.env.PASSWORD) {
		req.session.authenticated = true
		res.redirect('/')
	} else {
		res.redirect('/login')
	}
})
app.get('/', auth, function(req, res) {
	res.sendFile(__dirname + '/public/index.html')
})
app.get('/login', auth, function(req, res) {
	res.sendFile(__dirname + '/public/login.html')
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
