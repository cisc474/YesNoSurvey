/*
 * Andy's simple Yes/No survey, made to be refresh proof, 
 * quasi-anonymous, and authentication free.  A gift to the Blue Hen Investment Club
 * for their weekly stock pitches.
 * */
var http = require('http');
var path = require('path');
var express = require('express');
var socketio = require('socket.io');
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

//This is the line which I use to statically host the "client" folder if I don't make a 
//specific route later
router.use(express.static(path.resolve(__dirname, 'client')));

//This is a Class (note the capital letter) to keep track of my simple survey
var Survey = function(){
//I use a dummy variable for use deep inside of functions and loops.
    var that = this;
//some default values for an inactive, secret results survey
    this.status = "inactive";
    this.votes = {};
    this.results = {yes: "NA", no: "NA", percentage: "NA"};
    this.participants = 0;
//the vote method accepts a "user" which leans on the user 
//having an 'id' attribute (a UUID in fact)
//and a 'vote' attribute (only values of 'yes' and 'no' will be counted
//if the vote was valid then I return true, else false
    this.vote = function(user){
        
        //votes can be attempted any time but only accepted when survey is active
        if (that.status === "inactive"){
            return false;
        };

        //check to see if an id is "truthy"
        if (user.id) {
            //this trick is a nice way to see if a JSON object has a particular property
            if (!that.votes.hasOwnProperty(user.id)){
                //if this is your first vote in this survey then I'll increase the participant count
                that.participants += 1;
            }
            //either way I'll update your vote (you can change your mind while active)
            that.votes[user.id] = user.vote;
            return true;
        } else {
            return false;
        };
    };

    //to start or restart a survey I'll reset the vote object and make the status active
    this.begin = function(){
        that.votes = {};
        that.status = "active";
    };

    //this is a utility function for calculating the votes and participants
    //I extracted it so that it can be used to give the admins a live tally
    //but also to give the public a tally at survey end
    this.tally = function(){
        var results = { yes: 0, no: 0, participants : 0, percentage: 0.00};
        //this loop is how to iterate properties in a JSON object
        //I always end up google searching it to be sure, don't know why...
        for (var key in that.votes){
            if (that.votes.hasOwnProperty(key)){
                results[that.votes[key]] += 1;
                results.participants += 1;
            }
        }
        if (results.participants > 0) {
            results.percentage = Math.floor(results.yes*100.0 /results.participants);
        }
        return results;
    };

    //when the survey is done I set the status to inactive and make the results public
    this.end = function(){
        that.status = "inactive";
        that.results = that.tally();
    };

    //this will get a summary of the survey's current stats
    this.toJSON = function(){
        var obj = {};
        obj.status = that.status;
        obj.results = that.results;
        obj.participants = that.participants;
        return obj;
    }
    
    //this is the version for admins
    this.toSecretJSON = function(){
        var obj = {};
        obj.status = that.status;
        obj.results = that.tally();
        obj.participants = that.participants;
        return obj;
    }
};

//this line begins a fresh inactive survey
var survey = new Survey();

//this is the connection callback function for any new socket
io.sockets.on('connection', function(socket){
  
  //when I need to broadcast an update I'll send a public version and an 'admin' version
  var broadcast = function(){
     io.sockets.emit('survey-status', survey.toJSON());
     io.sockets.in('admin').emit('secret-status', survey.toSecretJSON());
  };  
 
  //this is a refactoring choice, 
  //if the same user opens multiple tabs I want them to be synced
  //so I have everyone join their own UUID named "room" and then send that room their 
  //status ("voted" and their vote or "not voted" and "NA")
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

  //this is a way for clients to request their status
  socket.on('status', function(data){
     socket.join(data.id);
     socket.emit('survey-status', survey.toJSON());
     sendVote(data.id);
  });

  //this is the similar method for admins
  socket.on('admin-status', function(data){
     socket.join('admin');
     socket.join(data.id);
     socket.emit('secret-status', survey.toSecretJSON());
  });
  
  //when casting a vote I update the survey and notify the user that it was accepted
  socket.on('cast-vote', function(user){
     survey.vote(user);
     sendVote(user.id);
     broadcast();
  });

  //no explanation needed I suspect, other than that broadcast now has complete results
  socket.on('end-survey', function(){
     survey.end();
     broadcast();
  });
  
  //I'll just instantiate a new Survey and emit a special 'vote-reset' event to let users 
  //know that the votes are all gone
  socket.on('begin-survey', function(){
     survey = new Survey();
     survey.begin();
     io.sockets.emit('vote-reset');
     broadcast();
  });

});

server.listen(22565, "0.0.0.0", function(){
  var addr = server.address();
  console.log("YesNo server listening at", addr.address + ":" + addr.port);
});
