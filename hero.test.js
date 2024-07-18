const hero = require('./hero');
const {
    sendHeroNotification,
    getCurrentHero,
    isDateInCurrentWeek_,
    buildMessage,
    sendNotification_
} = hero;

const WEBHOOK_URL = 'example';
const HERO = 'Lucifer';
const MOCKED_SPREADSHEET_DATA = {
    optionsRange: [
        [HERO, new Date],
        ['Baphomet', new Date + 8],
    ],
    responsibilities: []
};

const mockedLogger = jest.fn();
const mockedFetcher = jest.fn();
const mockedSpreadsheetAppGetUrl = jest.fn();


beforeAll(() => {
    global.UrlFetchApp = {
        fetch: mockedFetcher
    }

    global.Logger = {
        log: mockedLogger
    }

    global.SpreadsheetApp = {
        getActiveSpreadsheet: () => ({
            getUrl: mockedSpreadsheetAppGetUrl
        }),
        getActive: () => ({
            getSheetByName: () => ({
                getRange: () => ({
                    getValues: () => (MOCKED_SPREADSHEET_DATA.optionsRange)
                })
            })
        })
    }
});

describe('sendHeroNotification', () => {
    it('throws if required parameters are not passed', ()  => {
        expect(() => sendHeroNotification()).toThrow();
        expect(() => sendHeroNotification({})).toThrow();
        expect(() => sendHeroNotification({ customHero: 'de', customMessage: 'lulu' })).toThrow();
    });
    
    it('calls sendNotification_ with the correct payload', () => {
        const { payload } = sendHeroNotification({ webhookUrl: WEBHOOK_URL })
        expect(payload).toContain(HERO);
    });

    it('executes sendNotification_ with the correct payload when a custom hero function is passed', () => {
        const mockedCustomerHero = jest.fn().mockImplementation(() => (HERO));
        const { payload } = sendHeroNotification({ webhookUrl: WEBHOOK_URL, customHero: mockedCustomerHero });

        expect(mockedCustomerHero).toHaveBeenCalled();
        expect(payload).toContain(HERO);
    });

    it('executes sendNotification_ with the correct payload when a custom hero function is passed', () => {
        const mockedCustomMessage = jest.fn().mockImplementation(() => (HERO));
        const { payload } = sendHeroNotification({ webhookUrl: WEBHOOK_URL, customMessage: mockedCustomMessage });

        expect(mockedCustomMessage).toHaveBeenCalled();
        expect(payload).toContain(HERO);
    });

    it('executes sendNotification_ with the correct payload when a custom hero function is passed', () => {
        const customHeroResult =  'not this one';
        const mockedCustomMessage = jest.fn().mockImplementation(() => HERO);
        const mockedCustomerHero = jest.fn().mockImplementation(() => customHeroResult);
        const { payload } = sendHeroNotification({ webhookUrl: WEBHOOK_URL, customHero: mockedCustomerHero, customMessage: mockedCustomMessage });

        expect(mockedCustomMessage).toHaveBeenCalled();
        expect(payload).toContain(HERO);
        expect(payload).not.toContain(customHeroResult);
    });
});

describe('getCurrentHero', () => {
    it('throws if no list parameter is passed', () => {
        expect(() => {getCurrentHero()}).toThrow();
    });

    it('finds an active hero', () => {
        expect(getCurrentHero(MOCKED_SPREADSHEET_DATA.optionsRange)).toBe(HERO)
    });

    it.skip('finds an active hero', () => {
        jest.useFakeTimers().setSystemTime(Date.now() + 8);

        expect(getCurrentHero(MOCKED_SPREADSHEET_DATA.optionsRange)).toBe('Baphomet')
    });
});

describe('isDateInCurrentWeek_', () => {
    it('returns false if date is before the range of this week', () => {
        expect(isDateInCurrentWeek_('6/3/2024')).toBe(false);
    });

    it('returns false if date is after the range of this week', () => {
        expect(isDateInCurrentWeek_(new Date() + 8)).toBe(false);
    });

    it('returns true if date is within the range of this week', () => {
        expect(isDateInCurrentWeek_(new Date)).toBe(true);
    });
});

describe('buildMessage', () => {
    const noParametersCases = [
        {},
        { responsibilities: [] }
    ];
    const requiredParameters = {  heroName : HERO };

    it.each(noParametersCases)('throws if required parameters are missing', (a) => {
        expect(() => {buildMessage(a)}).toThrow();
    });

    it('does not throw if required parameters are', () => {
        expect(() => {buildMessage(requiredParameters)}).not.toThrow();
    });

    it('returns a message containing the hero name', () => {
        expect(JSON.stringify(buildMessage(requiredParameters))).toContain(HERO);
    });

    it('returns a message without responsibilities if responsibilities is an empty array', () => {
        const withResponsibilities = { ...requiredParameters, responsibilities: []}
        const message = JSON.stringify(buildMessage(withResponsibilities));

        expect(message).not.toContain(`responsibility`);
    });

    it('returns a message containing the list of responsibilities', () => {
        const responsibility = `enlighthen`;
        const withResponsibilities = { ...requiredParameters, responsibilities: [responsibility]}
        const message = JSON.stringify(buildMessage(withResponsibilities));

        expect(message).toContain(HERO);
        expect(message).toContain(responsibility);
    });
});

describe('sendNotification_', () => {
    const noParametersCases = [
        {},
        { webhookUrl : WEBHOOK_URL },
        { message : `message` }
    ];
    const requiredParameters = {  webhookUrl : WEBHOOK_URL,message : `message` };

    it.each(noParametersCases)('throws if required parameters are missing', (a) => {
        expect(() => {sendNotification_(a)}).toThrow();
    });

    it('does not throw if required parameters are', () => {
        expect(() => {sendNotification_(requiredParameters)}).not.toThrow();
    });

    it('calls UrlFetchApp when all parameters are correct', () => {
        sendNotification_(requiredParameters);

        expect(mockedFetcher).toHaveBeenCalled();
    });

    it('calls Logger when UrlFetchApp fails', () => {
        mockedFetcher.mockImplementationOnce(() => { throw Error })
        sendNotification_(requiredParameters);

        expect(mockedLogger).toHaveBeenCalled();
    });
});
