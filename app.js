'use strict';

var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var queue = [];

io.on('connection', socket => {
    console.log('made socket connection');
    io.emit('queue size', queue.length);
    socket.on('ride request', request => {
        queue.push(request);
        console.log("Requests in queue: " + queue.length);
        io.emit('queue size', queue.length);
    }),
    
    socket.on('customer request', request => {
        console.log("A driver has requested a customer");
        if(queue.length == 0){
          io.to(request).emit('error', "There aren't any customers waiting. Try again in a bit");
        }
        else{
          var selectedRequest = queue.shift();
          io.to(request).emit('ride request', 'You have a new ride request: latitude: ' + selectedRequest.lat + '\nlongitude: ' + selectedRequest.long + '\nid: ' + selectedRequest.id);
          io.to(selectedRequest.id).emit('confirmation', "Your taxi is on the way!");
          console.log("Requests in queue after shift: " + queue.length);
        }
    })
  });

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});