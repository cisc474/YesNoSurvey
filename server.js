var http = require('http');
var path = require('path');
var express = require('express');
var router = express();
var server = http.createServer(router);

var mongoose = require('mongoose');
var bodyParser = require('body-parser')
//Insecure by the way
router.use( express.bodyParser() );

router.use(express.static(path.resolve(__dirname, 'client')));

server.listen(22565, "0.0.0.0", function(){
  var addr = server.address();
  console.log("Upvote server listening at", addr.address + ":" + addr.port);
});
