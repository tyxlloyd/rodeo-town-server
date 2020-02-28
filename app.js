'use strict';

var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var queue = [];

io.on('connection', socket => {
    console.log('made socket connection');
    io.emit('queue size', queue.length);

    socket.on('disconnect', () => {
      console.log('Got disconnect!');
      io.emit('queue size', queue.length);
    }),
    
    socket.on('ride request', request => {
        queue.push(request);
        io.emit('queue size', queue.length);
        console.log("Requests in queue: " + queue.length);
    }),
    
    socket.on('customer request', request => {
        var socketList = io.sockets.server.eio.clients;
        var requestFound = false;
        var selectedRequest = null;

        console.log("A driver has requested a customer");
        while(!requestFound && queue.length > 0){
          selectedRequest = queue.shift();
          if (!(socketList[selectedRequest.id] === undefined)){
            requestFound = true;
          }
          else{
            console.log("Removed request from disconnected user");
          }
        }

        if(queue.length == 0 && !requestFound){
          var response =  "There aren't any customers waiting. Try again in a bit.";
          io.to(request.id).emit('empty queue', response);
          io.emit('queue size', queue.length);
        }
        else{
          io.to(request.id).emit('ride request', selectedRequest);
          var response = {
            taxiNumber: request.taxiNumber,
            driverID: request.id,
          }
          io.to(selectedRequest.id).emit('confirmation', response);
          io.emit('queue size', queue.length);
          console.log("Requests in queue after shift: " + queue.length);
        }
    }),

    socket.on('get driver location', request => {
      io.to(request.driverID).emit('request driver location', request.customerID);
    }),
    
    socket.on('get customer location', request => {
      io.to(request.customerID).emit('request customer location', request.driverID);
    }),
    
    socket.on('receive driver location', request => {
      io.to(request.customerID).emit('receive driver location', request.driverLocation);
    }),
    
    socket.on('receive customer location', request => {
      io.to(request.driverID).emit('receive customer location', request.customerLocation);
    }),
    
    socket.on('cancel ride request', request => {
      io.to(request).emit('cancel ride', "Ride request cancelled");
    })
    
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});