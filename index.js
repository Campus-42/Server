const firebaseFuncs = require("./assets/firebase/funcs");
const { campuses } = require("./assets/campuses");
const settings = require("./settings.json");
const airtable = require("./assets/airtable");
const notifications = require("./assets/notifications");
const $ = require("./assets/points/formulas");
const { db } = require("./assets/firebase");
const { Slack } = require("./assets/slack");
const Points = require("./assets/points");

console.log("\n[Info] Running back-end script...\n");

const levelLimits = [...Array(100).keys()].map((v, i) => $.levelLimit(i + 1));

campuses.forEach(async (campus) => {
  console.log(`\n[Info] Running campus ${campus}\n`);

  const passedEvents = await firebaseFuncs.getEndedEvents(campus);
  if (!passedEvents.error)
    console.log(
      "[Info] Received",
      passedEvents.events.length,
      "passed events from ",
      campus
    );

  // Unlist or handle error
  if (passedEvents.error)
    console.warn("Could not get events", passedEvents.error);
  else {
    if (settings.deleteEventBubble) {
      passedEvents.events.forEach((event) => {
        if (event.bubble_id)
          firebaseFuncs
            .deleteEventBubble(event.bubble_id)
            .then(() => console.log("Deleted event bubble", event.title))
            .catch((err) => console.warn("Could not delete event bubble", err));
      });
    }
    if (settings.deleteEventNotificationTopic) {
      passedEvents.events.forEach((event) => {
        if (event.notification_topic)
          firebaseFuncs
            .deleteEventNotificationTopic(event.notification_topic)
            .then(() =>
              console.log("Deleted event notification topic", event.title)
            )
            .catch((err) =>
              console.warn("Could not delete event notification topic", err)
            );
      });
    }

    if (settings.unlistPassedEvents) {
      passedEvents.events.forEach((event) =>
        firebaseFuncs
          .unlistEvent(campus, event.id)
          .then(() => console.log(`[Info] Successfully unlisted ${event.id}`))
          .catch((err) =>
            console.warn(`Could not unlist event ${event.id}`, err)
          )
      );
    }
    if (settings.giveEventEndPoints) {
      passedEvents.events.forEach((event) => {
        const participants = event.participants;
        participants.forEach((user) =>
          firebaseFuncs.rewardUserByEventEnd(user, true, 10)
        );
      });
    }
    if (settings.giveBubblePoints)
      Points.Bubbles.giveBubblePoints(passedEvents.events).catch(console.warn);

    if (settings.expireInvitesForPassedEvents) {
      passedEvents.events.forEach((evt) =>
        firebaseFuncs.expireInvitesForEvent(campus, evt.id)
      );
    }
  }

  // Should we store to mongo
  if (settings.saveToDatabase)
    passedEvents.events.forEach((event) =>
      console.log(
        `[WARN] Saving ${event.id} to MongoDB is currently not supported`
      )
    );

  // Should we send notifications
  if (settings.sendNotificiationAheadofEvent.send)
    firebaseFuncs.getEventsComingUp(campus).then((eventsSoon) => {
      if (!eventsSoon.error) {
        console.log(
          "[Info] Handling notifications",
          eventsSoon.events.length,
          "events at",
          campus
        );
        eventsSoon.events.forEach(async (elem) => {
          // Get participants
          const participants = [...new Set(elem.participants)];
          // Get their fcm tokens
          const tokens = await airtable.getFCMTokensForUsers(participants);
          // Create notification
          const title = `Your joined event starts soon`;
          const body = `${elem.title} starts in one hour. Your ticket will appear in the app 30 min before`;

          const messages = await Promise.all(
            tokens.map(async (token) => {
              return notifications.constructPayload(
                {
                  title: title,
                  body: body,
                },
                token,
                true
              );
            })
          );

          console.log(
            "[Info]",
            messages.length,
            "notifications sent for event",
            elem.title,
            "(" + elem.id + ")"
          );

          notifications.sendNotifications(messages);
        });
      } else
        console.trace(
          "[Error] Could not get events coming soon",
          eventsSoon.error
        );
    });

  if (settings.expireInvites) {
    const expiredInvites = await firebaseFuncs.getExpiredInvites(campus);
    if (expiredInvites.error)
      console.trace(
        "[Error] Could not get expired invites",
        expiredInvites.error
      );
    else {
      console.log(
        "[Info] Expiring",
        expiredInvites.invites.length,
        "invites for",
        campus
      );
      expiredInvites.invites.forEach((elem) =>
        firebaseFuncs.expireInvite(campus, elem.id)
      );
    }
  }

  db.collection("campuses")
    .doc(campus)
    .collection("data")
    .doc("point_system")
    .update({ level_limits: levelLimits })
    .catch(console.warn);
});
Slack.serverLog(
  `Server Side Functions/index.js ran at ${new Date().toUTCString()}`
);
