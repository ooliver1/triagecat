import * as github from "@actions/github";
import * as core from "@actions/core";

import { mockEventName, mockPayload } from "../__mocks__/@actions/github";
import run from "../src/main";

const fs = jest.requireActual("fs");

jest.mock("@actions/github");
jest.mock("@actions/core");

const gh = github.getOctokit("_");

const setLabelsMock = jest.spyOn(gh.rest.issues, "setLabels");
const getContentMock = jest.spyOn(gh.rest.repos, "getContent");
const getIssueMock = jest.spyOn(gh.rest.issues, "get");
const listReviewsMock = jest.spyOn(gh.rest.pulls, "listReviews");
const getCollaboratorPermissionLevelMock = jest.spyOn(
  gh.rest.repos,
  "getCollaboratorPermissionLevel"
);
const listMilestonesMock = jest.spyOn(gh.rest.issues, "listMilestones");
const updateIssueMock = jest.spyOn(gh.rest.issues, "update");

const configs: Record<string, string> = {
  draftsMark: fs.readFileSync("test/configs/prs/drafts/mark.yml"),
  reviewsMark: fs.readFileSync("test/configs/prs/reviews/mark.yml"),
  maintainersMark: fs.readFileSync(
    "test/configs/prs/reviews/maintainers/required/mark.yml"
  ),
  permissionsMark: fs.readFileSync(
    "test/configs/prs/reviews/maintainers/permissions/mark.yml"
  ),
  permissionsDoNotMark: fs.readFileSync(
    "test/configs/prs/reviews/maintainers/permissions/do-not-mark.yml"
  ),
  milestones: fs.readFileSync("test/configs/milestones/mark.yml"),
};

const mockInput: Record<string, string> = {
  "repo-token": "foo",
  "org-token": "bar",
};

jest
  .spyOn(core, "getInput")
  .mockImplementation(<any>((name: string, ..._: any[]) => mockInput[name]));

afterEach(() =>
  getContentMock.mockImplementation((..._) => {
    return <any>{ data: { content: "h: h", encoding: "utf8" } };
  })
);
afterAll(() => jest.restoreAllMocks());

describe("prs", () => {
  describe("drafts", () => {
    beforeEach(() => {
      mockEventName.mockReturnValue("pull_request_target");
    });

    describe("in progress", () => {
      beforeEach(() => {
        getIssueMock.mockReturnValue(<any>{
          data: {
            labels: ["awaiting review"],
          },
        });
        mockPayload.mockReturnValue({
          pull_request: {
            draft: true,
          },
          issue: {
            number: 123,
          },
          action: "converted_to_draft",
        });
      });

      test("mark", async () => {
        mockConfig("draftsMark");

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(1);
        expect(setLabelsMock).toHaveBeenCalledWith({
          owner: "ooliver1",
          repo: "h",
          issue_number: 123,
          labels: ["in progress"],
        });
      });

      test("do not mark", async () => {
        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });

    describe("awaiting review", () => {
      beforeEach(() => {
        getIssueMock.mockReturnValue(<any>{
          data: {
            labels: ["in progress"],
          },
        });
        mockPayload.mockReturnValue({
          pull_request: {
            draft: false,
          },
          issue: {
            number: 123,
          },
          action: "ready_for_review",
        });
      });

      test("mark", async () => {
        mockConfig("draftsMark");

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(1);
        expect(setLabelsMock).toHaveBeenCalledWith({
          owner: "ooliver1",
          repo: "h",
          issue_number: 123,
          labels: ["awaiting review"],
        });
      });

      test("do not mark", async () => {
        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("reviews", () => {
    beforeEach(() => {
      mockEventName.mockReturnValue("pull_request_review");
    });

    describe("required", () => {
      beforeEach(() => {
        getIssueMock.mockReturnValue(<any>{
          data: {
            labels: ["awaiting review"],
          },
        });
        listReviewsMock.mockReturnValue(<any>{
          data: [
            {
              user: {
                id: 123,
              },
              state: "approved",
            },
          ],
        });
        mockPayload.mockReturnValue(<any>{
          pull_request: {
            labels: ["awaiting review"],
          },
          issue: {
            number: 123,
          },
          action: "submitted",
          review: {
            user: {
              id: 123,
            },
            state: "approved",
          },
        });
      });

      test("mark", async () => {
        mockConfig("reviewsMark");

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(1);
        expect(setLabelsMock).toHaveBeenCalledWith({
          owner: "ooliver1",
          repo: "h",
          issue_number: 123,
          labels: ["awaiting merge"],
        });
      });

      test("do not mark", async () => {
        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("maintainers", () => {
    beforeEach(() => {
      getIssueMock.mockReturnValue(<any>{
        data: {
          labels: ["awaiting review"],
        },
      });
      listReviewsMock.mockReturnValue(<any>{
        data: [
          {
            user: {
              id: 123,
              name: "ooliver1",
            },
            state: "approved",
          },
        ],
      });
      mockPayload.mockReturnValue(<any>{
        pull_request: {
          labels: ["awaiting review"],
        },
        issue: {
          number: 123,
        },
        action: "submitted",
        review: {
          user: {
            id: 123,
          },
          state: "approved",
        },
      });
      getCollaboratorPermissionLevelMock.mockReturnValue(<any>{
        data: {
          user: {
            permissions: {
              admin: false,
              maintain: true,
              push: true,
              triage: true,
              pull: true,
            },
          },
        },
      });
    });

    describe("required", () => {
      test("mark", async () => {
        mockConfig("maintainersMark");

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(1);
        expect(setLabelsMock).toHaveBeenCalledWith({
          owner: "ooliver1",
          repo: "h",
          issue_number: 123,
          labels: ["awaiting merge"],
        });
      });

      test("do not mark", async () => {
        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe("permissions", () => {
    test("mark", async () => {
      mockConfig("permissionsMark");

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(1);
      expect(setLabelsMock).toHaveBeenCalledWith({
        owner: "ooliver1",
        repo: "h",
        issue_number: 123,
        labels: ["awaiting merge"],
      });
    });

    test("do not mark", async () => {
      mockConfig("permissionsDoNotMark");

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(0);
    });
  });
});

describe("push", () => {
  beforeEach(() => {
    mockEventName.mockReturnValue("push");
  });

  test("rejects event", async () => {
    expect(run()).rejects.toThrowError("Unsupported event: push");
  });
});

describe("milestones", () => {
  beforeEach(() => {
    mockEventName.mockReturnValue("issues");
  });

  describe("label", () => {
    test("milestone it", async () => {
      mockConfig("milestones");

      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [{ name: "2.0" }],
        },
        label: { name: "2.0" },
        action: "labeled",
      });
      listMilestonesMock.mockReturnValue(<any>{
        data: [{ title: "2.0 release", id: 1 }],
      });

      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(1);
      expect(updateIssueMock).toHaveBeenCalledWith({
        owner: "ooliver1",
        repo: "h",
        issue_number: 123,
        milestone: 1,
      });
    });

    test("do not milestone", async () => {
      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(0);
    });

    test("demilestone it", async () => {
      mockConfig("milestones");

      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        label: { name: "2.0" },
        action: "unlabeled",
      });

      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(1);
      expect(updateIssueMock).toHaveBeenCalledWith({
        owner: "ooliver1",
        repo: "h",
        issue_number: 123,
        milestone: null,
      });
    });

    test("error not found", async () => {
      mockConfig("milestones");

      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [{ name: "2.0" }],
        },
        label: { name: "2.0" },
        action: "labeled",
      });
      listMilestonesMock.mockReturnValue(<any>{
        data: [{ title: "random milestone name", id: 1 }],
      });

      expect(run()).rejects.toThrowError("Milestone not found");
    });

    test("expect no demilestone", async () => {
      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        label: { name: "2.0" },
        action: "unlabeled",
      });

      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(0);
    });

    test("does not error on no label", async () => {
      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        action: "labeled",
      });

      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(0);
    });

    test("does not error on no unlabel", async () => {
      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        action: "unlabeled",
      });

      await run();

      expect(updateIssueMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("milestone", () => {
    test("label it", async () => {
      mockConfig("milestones");

      mockPayload.mockReturnValue({
        issue: { number: 123 },
        milestone: { title: "2.0 release" },
        action: "milestoned",
      });
      getIssueMock.mockReturnValue(<any>{
        data: {
          labels: [],
        },
      });

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(1);
      expect(setLabelsMock).toHaveBeenCalledWith({
        owner: "ooliver1",
        repo: "h",
        issue_number: 123,
        labels: ["2.0"],
      });
    });

    test("unlabel it", async () => {
      mockConfig("milestones");

      mockPayload.mockReturnValue({
        issue: { number: 123 },
        milestone: { title: "2.0 release" },
        action: "demilestoned",
      });
      getIssueMock.mockReturnValue(<any>{
        data: {
          labels: ["2.0"],
        },
      });

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(1);
      expect(setLabelsMock).toHaveBeenCalledWith({
        owner: "ooliver1",
        repo: "h",
        issue_number: 123,
        labels: [],
      });
    });

    test("expect no label", async () => {
      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        milestone: { title: "2.0 release" },
        action: "milestoned",
      });

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(0);
    });

    test("expect no unlabel", async () => {
      mockPayload.mockReturnValue({
        issue: {
          number: 123,
          labels: [],
        },
        milestone: { title: "2.0 release" },
        action: "demilestoned",
      });

      await run();

      expect(setLabelsMock).toHaveBeenCalledTimes(0);
    });
  });
});

function mockConfig(name: string) {
  getContentMock.mockReturnValue(<any>{
    data: { content: configs[name], encoding: "utf8" },
  });
}
