var generateUUID = function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

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

var socket = io.connect();

var survey = {status:"inactive"};


angular.module('SurveyApp', [
        'ngStorage'
        ]).
controller('Ctrl', function(
            $scope,
            $localStorage
){
    $scope.$storage = $localStorage.$default({
        id: generateUUID()
    });

    socket.on('survey-status', function(data){ 
        $scope.survey = data; 
        $scope.$apply();
    });
    
    socket.on('your-status', function(data){ 
        $scope.user.vote = data.vote;
        $scope.user.status = data.status;
        $scope.$apply();
    });

    socket.on('reset', function(data){
        $scope.user.reset();
    });

    $scope.user = new Voter($scope.$storage.id);
    
    socket.emit('status', {id: $scope.user.id});

    $scope.vote = function(vote){
        if ($scope.survey.status !== "inactive"){ 
            $scope.user.castVote(vote);
            socket.emit('cast-vote', $scope.user);
        }
    };

    socket.emit('begin-survey');

    $scope.endSurvey = function(){
        socket.emit('end-survey');
    };

    $scope.newSurvey = function(){
        socket.emit('begin-survey');
    };
    
    $scope.newVoter = function(vote){
        var tempUser = new Voter(generateUUID());
        tempUser.castVote(vote);
        socket.emit('cast-vote', tempUser);
    }

});
