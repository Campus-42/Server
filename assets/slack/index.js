const { WebClient } = require("@slack/web-api");
const token = "xoxp-1721914194657-1715450830292-1740596143670-f61f48b6e5c01cfe5019ec7e728758ae";

const web = new WebClient(token);

exports.Slack = {
  serverLog: async function (message) {
    return web.chat.postMessage({
      channel: "#server-log",
      text: message,
    });
  },
};
