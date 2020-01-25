'use strict'

const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const crypto = require('./encryption')
const { logger } = require('./logger.js')
require('dotenv').config()
server.listen(process.env.LOCAL_PORT)

// EXPRESS MIDDLEWARE
app.use(
	session({
		secret: process.env.SESSION,
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 2592000000,
		},
	}),
)
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))

// EXPRESS PAGES
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
app.post('/auth', function(req, res) {
	if (crypto.hash(req.body.password) == process.env.PASSWORD) {
		req.session.authenticated = true
		res.redirect('/')
	} else {
		res.redirect('/login')
	}
})

// SOCKET.IO MIDDLEWARE
io.use((socket, next) => {
	if (socket.handshake.query.token == process.env.AUTH_TOKEN) {
		return next()
	} else {
		const e = new Error('authentication error')
		logger.warn(e)
		return next(e)
	}
})

// SOCKET.IO CONNECTION
io.on('connection', function(socket) {
	socket.on('send-data', function(data) {
		try {
			data = JSON.parse(crypto.decrypt(data))
			socket.broadcast.emit('send-data', data)
		} catch (e) {
			logger.warn(e)
		}
	})
	socket.on('request-data', function() {
		try {
			socket.broadcast.emit('request-data')
		} catch (e) {
			logger.warn(e)
		}
	})
	socket.on('toggle', function(data) {
		try {
			data = crypto.encrypt(JSON.stringify(data))
			socket.broadcast.emit('toggle', data)
			socket.broadcast.emit('request-data')
		} catch (e) {
			logger.warn(e)
		}
	})
})
