'use strict';

var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var queue = []; // This is where the request will be stored

// Log when a user connects
io.on('connection', socket => {
    console.log('made socket connection');
    io.emit('queue size', queue.length); // Emit how many customers are in the queue to all users

    // Log when a user disconnects
    socket.on('disconnect', () => {
      console.log('Got disconnect!');
      io.emit('queue size', queue.length);
    }),
    
    // When a customer sends a request, push it to the queue
    socket.on('ride request', request => {
        queue.push(request);
        io.emit('queue size', queue.length);
        console.log("Requests in queue: " + queue.length);
    }),
    
    // When a driver requests a customer, pop the oldest request from the queue
    socket.on('customer request', request => {
        var socketList = io.sockets.server.eio.clients;
        var requestFound = false;
        var selectedRequest = null;

        console.log("A driver has requested a customer");

        while(!requestFound && queue.length > 0){
          selectedRequest = queue.shift(); // Pop the oldest request from the queue
          
          // If the first popped request was from a disconnected user, keep popping from the queue
          // until a request from a connected user is found or the queue is empty
          if (!(socketList[selectedRequest.id] === undefined)){ // If the request is from a user that is still connected
            requestFound = true; // This will end the loop
          }
          else{
            console.log("Removed request from disconnected user");
          }
        }

        if(queue.length == 0 && !requestFound){ // If the queue is empty and the driver did not get a customer
          var response =  "There aren't any customers waiting. Try again in a bit.";
          io.to(request.id).emit('empty queue', response);
          io.emit('queue size', queue.length);
        }
        else{
          io.to(request.id).emit('ride request', selectedRequest);
          var response = { // This will be sent to the customer whose request just got accepted
            taxiNumber: request.taxiNumber,
            driverID: request.id,
            phoneNumber: request.phoneNumber,
          }
          io.to(selectedRequest.id).emit('confirmation', response); // Tell the customer their ride is on the way
          io.emit('queue size', queue.length);
          console.log("Requests in queue after shift: " + queue.length);
        }
    }),

    // Emits the driver's location to the corresponding customer
    socket.on('receive driver location', request => {
      io.to(request.customerID).emit('receive driver location', request.driverLocation);
    }),
    
    // Emits the customer's location to the corresponding driver
    socket.on('receive customer location', request => {
      io.to(request.driverID).emit('receive customer location', request.customerLocation);
    }),
    
    // Lets the driver or customer cancel the ride request after it has been accepted
    socket.on('cancel ride request', request => {
      io.to(request).emit('cancel ride', "Ride request cancelled");
    })
    
});

// Allows this code to run under Nodemon on port 8080
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});