const settings = require("../settings.json");
const d3 = require("d3-time-format");

const validDate = (date) => date instanceof Date && !isNaN(date) && date.getTime() !== NaN;
function parseTimeString(timeString) {
  const pmHours = timeString.includes("pm") ? 12 : 0; // Add 12 hours if it is in the evening
  var numbers = timeString.replace(/\D/g, ":").split(":");
  const hours = parseInt(numbers[0]) + pmHours;
  const mins = isNaN(numbers[1]) ? 0 : numbers[1] == "" ? 0 : parseInt(numbers[1]) || 0;
  return { hours, mins };
}

exports.getDateFromSUEvent = async function (rawDate, time) {
  const start = new Date(rawDate);
  const end = new Date(rawDate);

  if (!time) throw new Error("Non existing event date");
  const timeParts = (time || "").split("-");

  timeParts.forEach((elem, index) => {
    var txt = elem.trim().toLowerCase();
    var hour = 0;
    var mins = 0;

    if (elem.includes("midnight")) {
      hour = index == 0 ? 0 : 23;
      mins = index == 0 ? 0 : 59;
    } else {
      const time = parseTimeString(txt);
      if (isNaN(time.hours) || isNaN(time.hours)) throw new Error("invalid date");
      hour = time.hours;
      mins = time.mins;
    }

    if (index == 0) {
      start.setHours(hour);
      start.setMinutes(mins, 0, 0);
    } else if (index == 1) {
      end.setHours(hour);
      end.setMinutes(mins, 0, 0);
    }
  });

  return {
    start: start,
    end: end,
  };
};

exports.getMinutesFromDate = async function (minutes = 15) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date.getTime();
};
exports.getFutureDateMSInDays = async function (days = 14, date = new Date()) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() + days);
  return startDate.getTime();
};
exports.getFutureDateMSInMinutes = async function (minutes = 15, startDate = new Date()) {
  const date = startDate;
  date.setMinutes(date.getMinutes() + minutes);
  return date.getTime();
};

exports.getClosestRunIntervalDate = async function () {
  const date = new Date();
  const intervals = [];
  // Create the intervals per hour and insert into intervals array
  for (var x = 0; x < 60 / settings.scriptInterval; x++) {
    intervals.push(x * settings.scriptInterval);
  }
  // Loop through these intervals and set minutes for and seconds so they match the start of the script time
  const dateMins = date.getMinutes();
  const len = intervals.length;

  for (var i = 0; i < len; i++) {
    if (i == len - 1 && dateMins >= intervals[len - 1]) {
      date.setMinutes(intervals[i], 0, 0);
    } else if (dateMins >= intervals[i] && dateMins < intervals[i + 1]) {
      date.setMinutes(intervals[i], 0, 0);
    }
  }
  return date;
};

exports.getFutureDateWithSetHours = async function (hours, mins, secs, days = settings.repeatCreationDaysAdvance) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  futureDate.setHours(hours, mins, secs, 0);
  return futureDate;
};
