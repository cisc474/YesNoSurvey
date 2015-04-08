var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));

var Survey = function(){
    var that = this;
    this.status = "inactive";
    this.votes = {};
    this.results = {yes: "NA", no: "NA"};
    this.participants = 0;
    this.vote = function(user){
        if (that.status === "inactive"){
            return false;
        };

        if (user.id) {
            if (!that.votes.hasOwnProperty(user.id)){
                that.participants += 1;
            }
            that.votes[user.id] = user.vote;
            return true;
        } else {
            return false;
        };
    };

    this.begin = function(){
        that.votes = {};
        that.status = "active";
    };

    this.tally = function(){
        var results = { yes: 0, no: 0, participants : 0};
        for (var key in that.votes){
            if (that.votes.hasOwnProperty(key)){
                results[that.votes[key]] += 1;
                results.participants += 1;
            }
        }
        return results;
    };

    this.end = function(){
        that.status = "inactive";
        that.results = that.tally();
    };

    this.toJSON = function(){
        var obj = {};
        obj.status = that.status;
        obj.results = that.results;
        obj.participants = that.participants;
        return obj;
    }
    
    this.toSecretJSON = function(){
        var obj = {};
        obj.status = that.status;
        obj.results = that.tally();
        obj.participants = that.participants;
        return obj;
    }
};

var survey = new Survey();


io.sockets.on('connection', function(socket){
  
  var broadcast = function(){
     io.sockets.emit('survey-status', survey.toJSON());
  };  
 
  var sendVote = function(id){
     if (survey.votes.hasOwnProperty(id)){
        io.sockets.in(id).emit('your-status', {
            status : 'voted',
            vote: survey.votes[id]
        });
     } else {
        io.sockets.in(id).emit('your-status', {
            status : 'not voted',
            vote: "NA"
        });
     };
  };

  socket.on('status', function(data){
     socket.join(data.id);
     socket.emit('survey-status', survey.toJSON());
     sendVote(data.id);
  });

  socket.on('admin-status', function(){
     socket.emit('secret-status', survey.toSecretJSON());
  });
  
  socket.on('cast-vote', function(user){
     survey.vote(user);
     sendVote(user.id);
     broadcast();
  });

  socket.on('end-survey', function(){
     survey.end();
     broadcast();
  });
  
  socket.on('begin-survey', function(){
     survey = new Survey();
     survey.begin();
     io.sockets.emit('vote-reset');
     broadcast();
  });

});

server.listen(22565, "0.0.0.0", function(){
  var addr = server.address();
  console.log("Upvote server listening at", addr.address + ":" + addr.port);
});
