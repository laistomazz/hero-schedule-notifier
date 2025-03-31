/**
 * This script will send a notification message to the Slack channel configured in the webhook url
 * You can find further instructions in the Hero Notifier confluence page
 */

/**
 * @typedef {Object} sendHeroNotificationOptions
 * @property {string} webhookUrl
 * @property {Function} [customHero]
 * @property {Function} [customMessage]
 * @property {Function} [frequency] weekly, biweekly
 */

/**
 * @param {sendHeroNotificationOptions} options
 */
function sendHeroNotification({
  webhookUrl,
  customHero,
  customMessage,
  frequency,
} = {}) {
  const { optionsRange, responsibilities } = getSpreadsheetData();
  const currentHero =
    customHero && typeof customHero === "function"
      ? customHero()
      : getCurrentHero(optionsRange, frequency);

  if (!currentHero) {
    throw new Error(
      customHero
        ? "Your customHero implementation is not returning a valid string"
        : "No one is currently assigned as a hero"
    );
  }

  const message =
    customMessage && typeof customMessage === "function"
      ? customMessage()
      : buildMessage({ heroName: currentHero, responsibilities });

  return sendNotification_({ webhookUrl, message });
}

/**
 * @typedef {Object} spreadsheetData
 * @property {String[]} optionsRange
 * @property {String[]} responsibilities
 */

/**
 * @return {spreadsheetData}
 */
function getSpreadsheetData() {
  const ss = SpreadsheetApp.getActive();

  return {
    optionsRange: ss.getSheetByName("Schedule").getRange("A:B").getValues(),
    responsibilities: ss
      .getSheetByName("Responsibilities")
      .getRange("A:A")
      .getValues()
      .filter(String),
  };
}

/**
 * @param {spreadsheetData} list
 * @param {string} frequency
 * @return {string}
 */
function getCurrentHero(list, frequency) {
  if (!list) {
    throw new Error("list is missing");
  }

  return list.reduce((currentHero, item) => {
    if (currentHero) return currentHero;

    const [responsible, assignedWeekStartDate] = item;

    return isDateInCurrentPeriod_({
      date: new Date(assignedWeekStartDate),
      frequency,
    })
      ? responsible
      : currentHero;
  }, "");
}

function isDateInCurrentPeriod_({ date, frequency } = {}) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const firstDayOfWeek = new Date(today);
  const isFrequencyBiweekly = frequency && frequency === "biweekly";

  firstDayOfWeek.setDate(today.getDate() - dayOfWeek);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(
    firstDayOfWeek.getDate() + (isFrequencyBiweekly ? 13 : 6)
  );

  return date >= firstDayOfWeek && date <= lastDayOfWeek;
}

/**
 * @typedef {Object} buildMessageOptions
 * @property {string} heroName
 * @property {string[]} [responsibilities]
 */

/**
 * @param {buildMessageOptions} options
 */
function buildMessage({ heroName, responsibilities } = {}) {
  if (!heroName) {
    throw new Error("heroName is missing");
  }

  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":male_superhero: *Hero of the week* :female_superhero:",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `The hero of this week is *${heroName}*`,
      },
    },
  ];

  if (responsibilities && responsibilities.length) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Hey ${heroName}, your responsibilities during this week are: ${responsibilities.reduce(
          (str, responsibility) => {
            return responsibility.length ? `${str} \n- ${responsibility}` : str;
          },
          ""
        )}`,
      },
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `:date: Check the schedule <${SpreadsheetApp.getActiveSpreadsheet().getUrl()}|here>`,
    },
  });

  return { blocks };
}

function sendNotification_({ webhookUrl, message } = {}) {
  if (!webhookUrl) {
    throw new Error("webhookUrl is missing");
  }
  if (!message) {
    throw new Error("message is missing");
  }

  const options = {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(message),
  };

  try {
    UrlFetchApp.fetch(webhookUrl, options);
    return options;
  } catch (e) {
    Logger.log(e);
  }
}

module.exports = {
  sendHeroNotification,
  getSpreadsheetData,
  getCurrentHero,
  isDateInCurrentPeriod_,
  buildMessage,
  sendNotification_,
};
