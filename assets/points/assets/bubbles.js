const { db } = require("../../../../Api/assets/couchdb");
const firebaseFuncs = require("../../firebase/funcs");

const Bubbles = {
  getAllBubbleCopies: async function () {
    return db.find({ selector: { collection: "bubble_copy" } }).catch(() => {
      return { docs: [] };
    });
  },
  giveBubblePoints: async function (events) {
    /**
     * This function will return the bubble ids where
     * all the bubbble members attended the event
     */
    const bubbles = (await this.getAllBubbleCopies()).docs;
    if (!bubbles) throw new Error("Could not get bubbble copies");

    var attendedBubbles = [];
    var attendedUsers = [];
    events.forEach((event) => {
      bubbles.forEach((bubble) => {
        const allAttended = bubble.member_uids.every((m) => (event.attended_participants || []).includes(m));
        if (allAttended) {
          // Add the bubbble to attended bubbles
          if (attendedBubbles.findIndex((e) => e.id == bubble.id) < 0)
            attendedBubbles.push({ id: bubble.id, member_uids: bubble.member_uids });

          // Add the attended users so that they earn points
          bubble.member_uids.forEach((member) => attendedUsers.push(member));
        }
      });
    });
    attendedUsers = [...new Set(attendedUsers)];
    console.log(`[Info] ${attendedBubbles.length} bubbles have attended at least one event`);

    attendedUsers.forEach((uid) => {
      firebaseFuncs.rewardUserByEventEnd(uid, false, 2).then(() => console.log("Gave " + uid + " points"));
    });
  },
};
exports.Bubbles = Bubbles;
