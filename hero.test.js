const hero = require("./hero");
const {
  sendHeroNotification,
  getCurrentHero,
  isDateInCurrentPeriod_,
  buildMessage,
  sendNotification_,
} = hero;

const WEBHOOK_URL = "example";
const HERO = "Lucifer";
const VALID_OPTIONS_RANGE = [
  [HERO, new Date()],
  ["Baphomet", new Date() + 8],
];
const INVALID_OPTIONS_RANGE = [["Baphomet", new Date() + 8]];
const MOCKED_SPREADSHEET_DATA = {
  optionsRange: VALID_OPTIONS_RANGE,
  responsibilities: [],
};

const mockedLogger = jest.fn();
const mockedFetcher = jest.fn();
const mockedSpreadsheetAppGetUrl = jest.fn();

beforeAll(() => {
  global.UrlFetchApp = {
    fetch: mockedFetcher,
  };

  global.Logger = {
    log: mockedLogger,
  };

  global.SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
      getUrl: mockedSpreadsheetAppGetUrl,
    }),
    getActive: () => ({
      getSheetByName: () => ({
        getRange: () => ({
          getValues: () => MOCKED_SPREADSHEET_DATA.optionsRange,
        }),
      }),
    }),
  };
});

describe("sendHeroNotification", () => {
  it("throws if required parameters are not passed", () => {
    expect(() => sendHeroNotification()).toThrow();
    expect(() => sendHeroNotification({})).toThrow();
    expect(() =>
      sendHeroNotification({ customHero: "de", customMessage: "lulu" })
    ).toThrow();
  });

  it("calls sendNotification_ with the correct payload", () => {
    const { payload } = sendHeroNotification({ webhookUrl: WEBHOOK_URL });
    expect(payload).toContain(HERO);
  });

  it("executes sendNotification_ with the correct payload when a custom hero function is passed", () => {
    const mockedCustomerHero = jest.fn().mockImplementation(() => HERO);
    const { payload } = sendHeroNotification({
      webhookUrl: WEBHOOK_URL,
      customHero: mockedCustomerHero,
    });

    expect(mockedCustomerHero).toHaveBeenCalled();
    expect(payload).toContain(HERO);
  });

  it("executes sendNotification_ with the correct payload when a custom hero function is passed", () => {
    const mockedCustomMessage = jest.fn().mockImplementation(() => HERO);
    const { payload } = sendHeroNotification({
      webhookUrl: WEBHOOK_URL,
      customMessage: mockedCustomMessage,
    });

    expect(mockedCustomMessage).toHaveBeenCalled();
    expect(payload).toContain(HERO);
  });

  it("executes sendNotification_ with the correct payload when a custom hero function is passed", () => {
    const customHeroResult = "not this one";
    const mockedCustomMessage = jest.fn().mockImplementation(() => HERO);
    const mockedCustomerHero = jest
      .fn()
      .mockImplementation(() => customHeroResult);
    const { payload } = sendHeroNotification({
      webhookUrl: WEBHOOK_URL,
      customHero: mockedCustomerHero,
      customMessage: mockedCustomMessage,
    });

    expect(mockedCustomMessage).toHaveBeenCalled();
    expect(payload).toContain(HERO);
    expect(payload).not.toContain(customHeroResult);
  });

  it("throws when custom hero returns an invalid result", () => {
    const mockedCustomerHero = jest.fn().mockImplementation(() => null);

    expect(() => {
      sendHeroNotification({
        webhookUrl: WEBHOOK_URL,
        customHero: mockedCustomerHero,
      });
    }).toThrow();
  });

  it("throws when no one is currently a hero", () => {
    global.SpreadsheetApp = {
      getActiveSpreadsheet: () => ({
        getUrl: mockedSpreadsheetAppGetUrl,
      }),
      getActive: () => ({
        getSheetByName: () => ({
          getRange: () => ({
            getValues: () => MOCKED_SPREADSHEET_DATA.INVALID_OPTIONS_RANGE,
          }),
        }),
      }),
    };

    expect(() => {
      sendHeroNotification({
        webhookUrl: WEBHOOK_URL,
      });
    }).toThrow();
  });
});

describe("getCurrentHero", () => {
  it("throws if no list parameter is passed", () => {
    expect(() => {
      getCurrentHero();
    }).toThrow();
  });

  it("finds an active hero", () => {
    expect(getCurrentHero(MOCKED_SPREADSHEET_DATA.optionsRange)).toBe(HERO);
  });

  it.skip("finds an active hero", () => {
    jest.useFakeTimers().setSystemTime(Date.now() + 8);

    expect(getCurrentHero(MOCKED_SPREADSHEET_DATA.optionsRange)).toBe(
      "Baphomet"
    );
  });
});

describe("isDateInCurrentPeriod_", () => {
  it("returns false if date is before the range of this week", () => {
    expect(isDateInCurrentPeriod_({ date: "6/3/2024" })).toBe(false);
  });

  it("returns false if date is outside the range of this week", () => {
    const date = new Date();
    date.setDate(date.getDate() + 8);

    expect(isDateInCurrentPeriod_({ date })).toBe(false);
  });

  it("returns true if date is within the range of this week", () => {
    expect(isDateInCurrentPeriod_({ date: new Date() })).toBe(true);
  });

  describe("when frequency is biweekly", () => {
    const frequency = "biweekly";

    it("returns true if date is within the range of two weeks", () => {
      const date = new Date();
      date.setDate(date.getDate() + 8);

      expect(isDateInCurrentPeriod_({ date, frequency })).toBe(true);
    });

    it("returns false if date is outside the range of two weeks", () => {
      const date = new Date();
      date.setDate(date.getDate() + 14);

      expect(isDateInCurrentPeriod_({ date, frequency })).toBe(false);
    });
  });
});

describe("buildMessage", () => {
  const noParametersCases = [{}, { responsibilities: [] }];
  const requiredParameters = { heroName: HERO };

  it.each(noParametersCases)(
    "throws if required parameters are missing",
    (a) => {
      expect(() => {
        buildMessage(a);
      }).toThrow();
    }
  );

  it("does not throw if required parameters are", () => {
    expect(() => {
      buildMessage(requiredParameters);
    }).not.toThrow();
  });

  it("returns a message containing the hero name", () => {
    expect(JSON.stringify(buildMessage(requiredParameters))).toContain(HERO);
  });

  it("returns a message without responsibilities if responsibilities is an empty array", () => {
    const withResponsibilities = {
      ...requiredParameters,
      responsibilities: [],
    };
    const message = JSON.stringify(buildMessage(withResponsibilities));

    expect(message).not.toContain(`responsibility`);
  });

  it("returns a message containing the list of responsibilities", () => {
    const responsibility = `enlighthen`;
    const withResponsibilities = {
      ...requiredParameters,
      responsibilities: [responsibility],
    };
    const message = JSON.stringify(buildMessage(withResponsibilities));

    expect(message).toContain(HERO);
    expect(message).toContain(responsibility);
  });
});

describe("sendNotification_", () => {
  const noParametersCases = [
    {},
    { webhookUrl: WEBHOOK_URL },
    { message: `message` },
  ];
  const requiredParameters = { webhookUrl: WEBHOOK_URL, message: `message` };

  it.each(noParametersCases)(
    "throws if required parameters are missing",
    (a) => {
      expect(() => {
        sendNotification_(a);
      }).toThrow();
    }
  );

  it("does not throw if required parameters are", () => {
    expect(() => {
      sendNotification_(requiredParameters);
    }).not.toThrow();
  });

  it("calls UrlFetchApp when all parameters are correct", () => {
    sendNotification_(requiredParameters);

    expect(mockedFetcher).toHaveBeenCalled();
  });

  it("calls Logger when UrlFetchApp fails", () => {
    mockedFetcher.mockImplementationOnce(() => {
      throw Error;
    });
    sendNotification_(requiredParameters);

    expect(mockedLogger).toHaveBeenCalled();
  });
});
