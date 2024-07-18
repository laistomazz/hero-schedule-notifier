/**
 * This script will send a notification message to the Slack channel configured in the webhook url
 * You can find further instructions in the Hero Notifier confluence page
 */

/**
 * @typedef {Object} sendHeroNotificationOptions
 * @property {string} webhookUrl
 * @property {Function} [customHero]
 * @property {Function} [customMessage]
 */

/**
 * @param {sendHeroNotificationOptions} options
 */
function sendHeroNotification({ webhookUrl, customHero, customMessage }) {
    const { optionsRange, responsibilities } = getSpreadsheetData();
    const currentHero = customHero && typeof customHero === 'function' ? customHero() : getCurrentHero(optionsRange);
    const message = customMessage && typeof customMessage === 'function' ? customMessage() : buildMessage({ heroName: currentHero, responsibilities });

    console.log(message);
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
    optionsRange: ss.getSheetByName('Schedule').getRange("A:B").getValues(),
    responsibilities: ss.getSheetByName('Responsibilities').getRange("A:A").getValues().filter(String)
  }
}
  
/**
 * @param {spreadsheetData} list
 * @return {string}
 */
function getCurrentHero(list) {
    if (!list) {
        throw new Error ('list is missing')
    }
    
    return list.reduce((currentHero, item) => {
        if (currentHero) return currentHero;

        const [ responsible, assignedWeekStartDate ] = item;

        return isDateInCurrentWeek_(new Date(assignedWeekStartDate)) ? responsible : currentHero;
    }, '');
}

function isDateInCurrentWeek_(date) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - dayOfWeek);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

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
    if (!heroName) { throw new Error ('heroName is missing') };

    const blocks = [
        {
            "type": "section",
            "text": {
            "type": "mrkdwn",
            "text": ":male_superhero: *Hero of the week* :female_superhero:"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
            "type": "mrkdwn",
            "text": `The hero of this week is *${heroName}*`
            }
        }
        ]

    if (responsibilities && responsibilities.length ) {
        blocks.push({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `Hey ${heroName}, your responsibilities during this week are: ${responsibilities.reduce((str, responsibility) => { return responsibility.length ? `${str} \n- ${responsibility}` : str}, '')}`
            }
        });
    }

    blocks.push({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `:date: Check the schedule <${SpreadsheetApp.getActiveSpreadsheet().getUrl()}|here>`
        }
      })

    return { blocks };
}

function sendNotification_({ webhookUrl, message } = {}) {
    if (!webhookUrl) { throw new Error ('webhookUrl is missing')}
    if (!message) { throw new Error ('message is missing')}

    const options = {
        "method": "post", 
        "contentType": "application/json", 
        "muteHttpExceptions": true, 
        "payload": JSON.stringify(message) 
    };

    try {
        UrlFetchApp.fetch(webhookUrl, options);
        return options;
    } catch(e) {
        Logger.log(e);
    }
}

module.exports = {
    sendHeroNotification,
    getSpreadsheetData,
    getCurrentHero,
    isDateInCurrentWeek_,
    buildMessage,
    sendNotification_
};
