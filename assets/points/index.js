const { Bubbles } = require("./assets/bubbles");

const points = {
  updateCampusPoints: async function (campusKey, update) {
    const valid = points.validateProposedCampusPoints(update);
    if (!valid) throw new Error("The campus points are not valid and will therefor not be uploaded");
    else return mongo.updateCampusPoints(campusKey, update);
  },
  validateProposedCampusPoints: function (update) {
    return (
      typeof update.campus_key == "string" &&
      typeof update.points.main_multiplier == "number" &&
      typeof update.points.bubble_multiplier == "number" &&
      typeof update.points.external_invite == "number"
    );
  },
  Bubbles: Bubbles,
};

module.exports = points;
