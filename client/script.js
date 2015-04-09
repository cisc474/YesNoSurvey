//this method was taken from a stack overflow response, I liked the d + Math.random() part.
var generateUUID = function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

//my Voter class which has a simple reset and castVote method
var Voter = function(id){
    var that = this;
    this.id = id;
    this.reset = function(){
        that.status = "not voted";
        that.vote = "NA";
    };
    this.castVote = function(vote){
        that.vote = vote;
        that.status = "voted";
    };
    this.reset();
}

//start an io connection
//also a dummy survey to start
var socket = io.connect();
var survey = {status:"inactive", percentage: "NA" };

angular.module('SurveyApp', [
        'ngStorage'
        ]).
controller('Ctrl', function(
            $scope,
            $localStorage
            ){
//I'm using an ngStorage library for my localStorage
//it would probably be cooler to use vanilla JS for this project
    $scope.$storage = $localStorage.$default({
        id: generateUUID()
    });

//this was a nice method to check if a socket is connected
    $scope.connected = socket.socket.connected;
//then I can update when the connection is established or lost
    socket.on('connect', function(){
        $scope.connected = true;
    });

    socket.on('disconnect', function(){
        $scope.connected = false;
    });
//react to broadcast survey data
    socket.on('survey-status', function(data){ 
        $scope.survey = data; 
        $scope.$apply();
    });
//also allow specific data about my vote (useful for multiple tab voters)
    socket.on('your-status', function(data){ 
        $scope.user.vote = data.vote;
        $scope.user.status = data.status;
        $scope.$apply();
    });
//when a new survey starts I should reset
    socket.on('vote-reset', function(data){
        $scope.user.reset();
    });
//defining this user as a voter with UUID
    $scope.user = new Voter($scope.$storage.id);
//asking the server for my data
    socket.emit('status', {id: $scope.user.id});
//a method to react to button clicks
    $scope.vote = function(vote){
        if ($scope.survey.status !== "inactive"){
            //cast the vote as a user
            $scope.user.castVote(vote);
            //share the vote with the server
            socket.emit('cast-vote', $scope.user);
        }
    };

});
