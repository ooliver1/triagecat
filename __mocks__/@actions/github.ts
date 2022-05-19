export const mockEventName = jest.fn();
export const mockPayload = jest.fn();

export const context = {
  get eventName() {
    return mockEventName();
  },
  get payload() {
    return mockPayload();
  },
  issue: {
    number: 123,
  },
  repo: {
    owner: "ooliver1",
    repo: "h",
  },
};

const mockApi = {
  rest: {
    issues: {
      setLabels: jest.fn(),
      get: jest.fn(),
    },
    repos: {
      getContent: jest.fn((..._) => {
        return { data: { content: "h: h", encoding: "utf8" } };
      }),
      getCollaboratorPermissionLevel: jest.fn(),
    },
    pulls: {
      listReviews: jest.fn(),
    },
  },
};

export const getOctokit = jest.fn(() => mockApi);
