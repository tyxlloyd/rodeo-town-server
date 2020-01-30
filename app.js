'use strict';

var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.on('connection', socket => {
    console.log('made socket connection')
    socket.on('ride request', request => {
        console.log(request);
        io.emit('ride request', 'You have a new ride request: <coordinates>');
    })
  });

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});