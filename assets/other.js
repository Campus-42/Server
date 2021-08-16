const { getAllTags } = require("./airtable");
const { MultiSelect, prompt } = require("enquirer");
const settings = require("../settings.json");
const opn = require("opn");
const firebase = require("./firebase");

const validDate = (date) =>
  date instanceof Date && !isNaN(date) && date.getTime() !== NaN;
async function promptDate(type) {
  return prompt({
    type: "input",
    name: "date",
    message: `The ${type} date is invalid, please enter the date YYYY-MM-DDTHH:MM`,
  })
    .then((res) => {
      const date = new Date(Date.parse(res.date));

      if (validDate(date)) return date;
      else return promptDate(type);
    })
    .catch((err) => {
      settings.debugErrors && console.trace("[Error]", err);
      return promptDate(type);
    });
}

exports.handleAllEventsTags = async function (events) {
  return Promise.all(events.map(async (evt) => handleTags(evt)));
};

const handleTags = async function (event, eventID, campusKey) {
  if (process.argv[2] == "true") {
    console.log("Handling tags for " + event.id);
    const tags = await getAllTags();

    const ref = firebase.db
      .collection("campuses")
      .doc(campusKey)
      .collection("events")
      .doc(eventID);

    console.log("Title:", [event.title]);
    console.log("Description:", [event.description]);

    // Open the image in default browser
    !process.argv.includes("--open_link=false") && opn(event.link.url);

    const { end, start } = event.date;
    settings.debugErrors && console.log("start=", start, "end=", end);
    if (!validDate(start)) {
      console.log("Start date is not valid");
      const date = await promptDate("start");
      settings.debugErrors && console.log("start", date);
      event.date.start = date;
    }
    if (!validDate(end)) {
      console.log("End date is not valid");
      const date = await promptDate("end");
      settings.debugErrors && console.log("end", date);
      event.date.end = date;
    }

    settings.debugErrors && console.log(event.date);
    const prompt = new MultiSelect({
      name: "event_tags",
      message: "Pick the most suitable event tags",
      choices: tags.sort((elem) => elem.tag),
    });
    return prompt
      .run()
      .then(async (answers) => {
        const newEvent = {
          ...event,
          participants: [],
          number_of_participants: 0,
          date: {
            start: new Date(event.date.start),
            end: new Date(event.date.end),
          },
          tags: answers || [],
        };

        delete newEvent.id;

        console.log("Event", newEvent);

        return ref
          .update(newEvent)
          .then(() => console.log("Updated event", eventID))
          .catch(async () => {
            return ref
              .set(newEvent)
              .then(() => console.log("Created event", eventID))
              .catch((err) => {
                throw err;
              });
          });
      })
      .catch((err) => {
        settings.debugErrors && console.trace("[Error]", err);
        return { error: err };
      });
  } else {
    console.log(
      "Not updating event '" +
        event.id +
        "' due to 'true' not being passed as CLI argument"
    );
    return Promise.resolve("ok");
  }

  // if (selectedTags.error)
  //   settings.debugErrors && console.trace("[Error]", selectedTags.error);
  // else {
  //   return selectedTags.tags
  //     .filter((elem) => elem === "create_new")
  //     .forEach((elem) => {
  //       return createTag(elem, imagePath);
  //     });
  // }
};

exports.handleTags = handleTags;
