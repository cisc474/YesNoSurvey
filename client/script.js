var generateUUID = function(){
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

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
        var results = { yes: 0, no: 0};
        for (var key in that.votes){
            if (that.votes.hasOwnProperty(key)){
                results[that.votes[key]] += 1;
            }
        }
        that.results = results;
    };
    
    this.end = function(){
        that.status = "inactive";
        that.tally();
    };
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

    $scope.survey = new Survey();
    $scope.user = new Voter($scope.$storage.id);

    $scope.vote = function(vote){
        if ($scope.survey.status !== "inactive"){ 
            $scope.user.castVote(vote);
            $scope.survey.vote($scope.user);
        }
    };

    $scope.survey.begin();

    $scope.endSurvey = function(){
        $scope.survey.end();
    };

    $scope.newSurvey = function(){
        $scope.survey = new Survey();
        $scope.user.reset();
        $scope.survey.begin();
    };
    
    $scope.newVoter = function(vote){
        var tempUser = new Voter(generateUUID());
        tempUser.castVote(vote);
        $scope.survey.vote(tempUser);
    }

});
