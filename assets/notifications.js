const { messaging } = require("./firebase");
exports.constructPayload = async function (
  notification = { title: "", body: "" },
  token,
  playSound = false,
  inAppScreen = "null",
  badge = "0",
  obj_type = "null",
  obj_id = "null"
) {
  /**
   * Generative function to create a notification payload
   * @params includes notification title and body and optional features
   */
  return {
    notification: notification,
    android: {
      notification: {
        click_action: "Open",
        sound: playSound ? "bubble_pop" : "none",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: playSound ? "bubble_pop" : "none",
          click_action: "Open",
        },
      },
    },
    data: {
      badge: badge,
      in_app_screen: inAppScreen,
      type: obj_type,
      obj_id: obj_id,
    },
    token: token,
  };
};

exports.sendNotifications = async function (payloads = []) {
  /**
   * Send a notification to specified tokens
   */
  return messaging
    .sendAll(payloads)
    .then((res) => {
      console.log("[Info] Successfully sent", res.successCount, "notifications");
      return res;
    })
    .catch((err) => {
      console.trace("[Error] Could not send notification messages", err);
      throw err;
    });
};
