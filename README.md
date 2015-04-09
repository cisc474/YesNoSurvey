## A Yes/No survey system
The big goal is to allow fast and loose yes/no surveys for small groups.

My specifications were roughly like this:

### A club officer must be able to start a new survey and conclude a current survey

### All members should be able to login via mobile devices and vote yes or no.

### All members should be able to see the results only when the survey is complete.

### A club member should not be able to easily or accidently vote more than one time per survey.

---

## Solutions:

I use socketio for connectivity.  Angular for the front end.  Real UD CSS values.  ngStorage for quick localStorage access and UUID v4 for generating uuids.

I also copy pasted to create the admin page, a bad practice that I'm OK living with for this project.
