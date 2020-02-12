'use strict';

var express = require('express');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var queue = [];

io.on('connection', socket => {
    console.log('made socket connection');
    //io.emit('queue size', queue.length);
    socket.on('ride request', request => {
        queue.push(request);
        console.log("Requests in queue: " + queue.length);
        //io.emit('queue size', queue.length);
    }),
    
    socket.on('customer request', request => {
        console.log("A driver has requested a customer");
        if(queue.length == 0){
          io.to(request).emit('error', "There aren't any customers waiting. Try again in a bit");
        }
        else{
          var selectedRequest = queue.shift();
          io.to(request).emit('ride request', selectedRequest);
          var response = {
            message: "Your taxi is on the way!",
            driverID: request,
          }
          io.to(selectedRequest.id).emit('confirmation', response);
          console.log("Requests in queue after shift: " + queue.length);
        }
    }),
	socket.on('get queue size', request => {
		console.log("Someone has requested the queue size.");
		io.to(request).emit('queue size', queue.length);
  }),

  socket.on('get driver location', request => {
		io.to(request.driverID).emit('request driver location', request.customerID);
  }),
  
  socket.on('get customer location', request => {
		io.to(request.customerID).emit('request customer location', request.driverID);
  }),
  
  socket.on('recieve driver location', request => {
		io.to(request.customerID).emit('recieve driver location', request.driverLocation);
  }),
  
  socket.on('recieve customer location', request => {
		io.to(request.driverID).emit('recieve customer location', request.customerLocation);
	})
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});