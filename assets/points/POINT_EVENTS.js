exports.POINT_EVENTS = {
  /**
   * The different point events
   *
   * @returns {
   *    point: Number, <= Always
   *    criteria: String, <= Always
   *    response: String, <= Always, response to the user for their actions
   *  }
   */
  confirmedReferralInvite: {
    points: 40,
    response: "You have successfully claimed a referral link!",
    criteria: "Invite new friends to the app and you both earn more points",
    name: "Refer a Friend",
  },
  confirmedEventAttendance: {
    points: 10,
    response: "You have received 10 points for joining an event",
    criteria: "Receive your reward when you've joined and attended an event",
    name: "Join an Event",
  },
  confirmedSociety: {
    points: 20,
    response: "You have received 20 points for joining a society",
    criteria:
      "Join a society and receive points as a reward for engaging with other students",
    name: "Join a Society",
  },
  appLogin: {
    points: 1,
    response: undefined,
    criteria: "Log into the app daily to receive a reward",
    name: "Daily Login",
  },
  confirmedInvitation: {
    points: 5,
    response:
      "You have received points for claiming and confirming an invitaton",
    criteria:
      "Accept your friends' invitations to events, societies and bubbles in order to receive points",
    name: "Claim an Invitation",
  },
  newUser: {
    points: 5,
    response: false,
    criteria: "When you create an account we'll give you a welcome gift",
    name: "Create Account",
    show: false,
  },
  _reload: {
    points: 0,
    response: false,
    criteria: "To reload user's points",
    show: false,
  },
};

exports.isPointEventValid = function (event) {
  /**
   * A function to validate a point event before being uploaded to the database
   * @params point event
   */
  !event.points &&
    console.log(`Price is invalid '${event.points}', it should be a number`);
  !event.criteria &&
    console.log(
      `Criteria is invalid '${event.criteria}', it should be a string`
    );
  !event.name &&
    console.log(`Name is invalid '${event.name}', it should be a string`);
  return (
    typeof event.points == "number" &&
    typeof event.name === "string" &&
    typeof event.criteria == "string" &&
    event.show !== false
  );
};
