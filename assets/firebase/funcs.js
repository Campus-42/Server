const firebase = require("./index");
const date = require("../date");
const settings = require("../../settings.json");
const general = require("../json/general.json");
const other = require("../other");

async function parseEventData(id, data) {
  return {
    ...data,
    id: id,
    date: { end: data.date.end.toDate(), start: data.date.start.toDate() },
  };
}
async function makeScrapeID(id) {
  return `su_scrape_${id}`;
}

async function getEvent(campusKey, id) {
  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .doc(id)
    .get()
    .then(async (doc) => {
      return { data: doc.data() || {} };
    })
    .catch((err) => {
      return { error: err };
    });
}
async function extractLinks(text) {
  return text.match(
    /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
  );
}
async function extractEmails(text) {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
}
async function updateEvent(event, eventID, campusKey) {
  // Don't change the fields that dictate who has bought a ticket or not
  const updateEventDoc = { ...event };
  delete updateEventDoc.number_of_participants;
  delete updateEventDoc.participants;

  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .doc(eventID)
    .update(updateEventDoc)
    .then(() => console.log("Successfully updated event", eventID))
    .catch((err) => settings.debugErrors && console.trace("[Error]", err))
    .finally(() => uploadToCampusTest(event, eventID));
}
async function uploadToCampusTest(event, eventID) {
  console.log("Uploading to test campus");
  return firebase.db
    .collection("campuses")
    .doc("campus_test")
    .collection("events")
    .doc(eventID)
    .set(event)
    .then(() =>
      console.log("Successfully updated event to campus_text", eventID)
    )
    .catch((err) => settings.debugErrors && console.trace("[Error]", err));
}

exports.formatAndUploadScrapedEvent = async function (campusKey, events) {
  const formattedEvents = [];
  async function done(currentIndex, totalIndex = formattedEvents.length - 1) {
    try {
      const eventID = await makeScrapeID(formattedEvents[currentIndex].id);
      if ((formattedEvents[currentIndex].tags || []).length === 0)
        return other
          .handleTags(formattedEvents[currentIndex], eventID, campusKey)
          .then(
            () =>
              formattedEvents[currentIndex + 1] !== undefined &&
              done(currentIndex + 1, totalIndex)
          )
          .catch(
            () =>
              formattedEvents[currentIndex + 1] !== undefined &&
              done(currentIndex + 1, totalIndex)
          );
      else
        updateEvent(formattedEvents[currentIndex], eventID, campusKey)
          .then(
            () =>
              formattedEvents[currentIndex + 1] !== undefined &&
              done(currentIndex + 1, totalIndex)
          )
          .catch(
            () =>
              formattedEvents[currentIndex + 1] !== undefined &&
              done(currentIndex + 1, totalIndex)
          );
    } catch (err) {
      settings.debugErrors && console.trace("[Error]", err);
      formattedEvents[currentIndex + 1] !== undefined &&
        done(currentIndex + 1, totalIndex);
    }
  }

  Promise.all(
    await events.map(async (evt, index) => {
      const eventID = await makeScrapeID(evt.id);
      const prevEvent = await getEvent(campusKey, eventID);
      const searchIndex = evt.description
        .toLowerCase()
        .trim()
        .replace("\n", "")
        .split(" ")
        .concat(evt.title.toLowerCase().trim().replace("\n", "").split(" "));

      const email = await extractEmails(evt.description.toLowerCase());

      formattedEvents.push({
        ...evt,
        description: evt.description.trim(),
        scraped_event: true,
        society_id: general.campus42SocietyID,
        confirmed: true,
        visible: true,
        edit_log: [
          { uid: "campus42_terminal", date: new Date(), action: "repetition" },
        ],
        number_of_participants: 0,
        pricing: evt.pricing,
        repeat: {
          doesRepeat: false,
          interval: 0,
        },
        search_index: searchIndex,
        society_name: "Campus42 Events",
        join_link: evt.join_link,
        email: {
          show: false,
          ...(email !== null
            ? {
                show: true,
                address: email[0],
              }
            : {}),
        },
        ...(!prevEvent.error && prevEvent.data !== undefined
          ? {
              participants: prevEvent.data.participants,
              number_of_participants: prevEvent.data.number_of_participants,
              tags: prevEvent.data.tags,
            }
          : {
              tags: [],
            }),
      });
      if (index == events.length - 1) done(0, formattedEvents.length);
    })
  );
};

exports.formatAndUploadScrapedAnnouncement = async function (
  campusKey,
  announcements
) {
  const ref = firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("blogs");
  announcements.map((el) => {
    const dbRef = ref.doc(el.id);
    delete el.id; // Don't want id lingering in actual document
    dbRef.set(el).catch(console.warn);
  });
};
exports.rewardUserByEventEnd = async function (
  uid,
  incrementEventCount = false,
  points = 10
) {
  const update = {
    points: firebase.admin.firestore.FieldValue.increment(points),
  };
  if (incrementEventCount)
    (update.event_count = firebase.admin.firestore.FieldValue.increment(1)),
      firebase.db
        .collection("users")
        .doc(uid)
        .update(update)
        .catch((err) => settings.debugErrors && console.trace("[Error]", err));
};
exports.getEndedEvents = async function (campusKey) {
  const futureDate = await date.getMinutesFromDate(-3600);

  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .where("visible", "==", true)
    .where("confirmed", "==", true)
    .where("end_ms", "<=", futureDate)
    .get()
    .then((querySnapShot) => {
      const events = [];
      querySnapShot.forEach(async (event) =>
        events.push(await parseEventData(event.id, event.data()))
      );
      return { events: events };
    })
    .catch((err) => {
      return { error: err };
    });
};

exports.unlistEvent = async function (campusKey, eventID) {
  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .doc(eventID)
    .update({ visible: false })
    .then(() => {
      return true;
    })
    .catch((err) => {
      throw err;
    });
};

exports.deleteEventNotificationTopic = async function(topicName){
  return firebase.db.collection("notification_topics").doc(topicName).delete()
}
exports.deleteEventBubble = async function(bubbleId){
  return firebase.db.collection("bubbles").doc(bubbleId).delete()
}

exports.getEventsComingUp = async function (campusKey) {
  // Get the lower and upper limit
  const lowerLimit = await date.getFutureDateMSInMinutes(
    settings.sendNotificiationAheadofEvent.minutes,
    await date.getClosestRunIntervalDate()
  );
  const upperLimit = await date.getFutureDateMSInMinutes(
    settings.sendNotificiationAheadofEvent.minutes + settings.scriptInterval,
    await date.getClosestRunIntervalDate()
  );

  // Get all relevant events
  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .where("confirmed", "==", true)
    .where("visible", "==", true)
    .where("start_ms", "<", upperLimit)
    .where("start_ms", ">=", lowerLimit)
    .get()
    .then(async (querySnapShot) => {
      console.log(
        `[Info] Received ${querySnapShot.size} events to send notifications to`
      );
      const events = [];
      querySnapShot.forEach(async (event) =>
        events.push(await parseEventData(event.id, event.data()))
      );
      return { events: events };
    })
    .catch((err) => {
      return { error: err };
    });
};

exports.getRepeatEvents = async function (campusKey) {
  const start = await date.getFutureDateWithSetHours(0, 0, 0);
  const end = await date.getFutureDateWithSetHours(23, 59, 59);

  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .where("next_event_ms", "<=", end.getTime())
    .where("next_event_ms", ">=", start.getTime())
    .where("confirmed", "==", true)
    .where("visible", "==", true)
    .get()
    .then(async (querySnapShot) => {
      const events = [];
      querySnapShot.forEach(async (doc) =>
        events.push(await parseEventData(doc.id, doc.data()))
      );
      return { events: events };
    })
    .catch((err) => {
      return { error: err };
    });
};

exports.createEventRepetition = async function (campusKey, event) {
  const startDate = await date.getFutureDateMSInDays(
    parseInt(event.repeat.interval),
    event.date.start
  );
  const endDate = await date.getFutureDateMSInDays(
    parseInt(event.repeat.interval),
    event.date.end
  );

  const data = {
    ...event,
    date: {
      start: new Date(startDate),
      end: new Date(endDate),
    },
    origin_event: event.id,
    start_ms: new Date(startDate).getTime(),
    end_ms: new Date(endDate).getTime(),
    edit_log: [
      { uid: "campus42_terminal", date: new Date(), action: "repetition" },
    ],
  };
  delete data.id;
  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("events")
    .add(data)
    .then((doc) => {
      return doc;
    })
    .catch((err) => {
      throw err;
    });
};

exports.getExpiredInvites = async function (campusKey) {
  const runDate = await date.getClosestRunIntervalDate();
  const upperLimit = await date.getFutureDateMSInMinutes(
    settings.scriptInterval,
    runDate
  );
  delete runDate;

  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("invites")
    .where("valid_until", "<=", upperLimit)
    .where("visible", "==", true)
    .get()
    .then(async (querySnapShot) => {
      const invites = [];
      querySnapShot.forEach((doc) =>
        invites.push({ ...doc.data(), id: doc.id })
      );
      return { invites: invites };
    })
    .catch((err) => {
      return { error: err };
    });
};

exports.expireInvite = async function (campusKey, inviteID) {
  return firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("invites")
    .doc(inviteID)
    .update({ visible: false })
    .catch((err) => console.trace("[Error] Could not expire invite", err));
};

exports.expireInvitesForEvent = async function (campusKey, eventID) {
  async function expireInvite(inviteID) {
    return firebase.db
      .collection("campuses")
      .doc(campusKey)
      .collection("invites")
      .doc(inviteID)
      .update({
        valid_until: Date.now(),
      })
      .then((res) => {
        console.log("[Info] Expired invite event", inviteID);
        return res;
      })
      .catch((err) => {
        console.warn(err);
        return err;
      });
  }

  firebase.db
    .collection("campuses")
    .doc(campusKey)
    .collection("invites")
    .where("obj_id", "==", eventID)
    .where("type", "==", "event")
    .get()
    .then((querySnapShot) => {
      querySnapShot.forEach((invite) => expireInvite(invite.id));
      return { successful: true };
    })
    .catch((err) => {
      console.warn(err);
      return err;
    });
};
