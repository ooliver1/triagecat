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

const configs: Record<string, string> = {
  draftsInProgress: fs.readFileSync("test/configs/drafts-in-progress.yml"),
  draftsDoNotMark: fs.readFileSync("test/configs/drafts-do-not-mark.yml"),
};

const mockInput: Record<string, string> = {
  "repo-token": "foo",
  "org-token": "bar",
};

jest
  .spyOn(core, "getInput")
  .mockImplementation(<any>((name: string, ..._: any[]) => mockInput[name]));

afterAll(() => jest.restoreAllMocks());

describe("pull_request", () => {
  beforeEach(() => {
    mockEventName.mockReturnValue("pull_request");
  });

  describe("drafts", () => {
    describe("in progress", () => {
      test("mark", async () => {
        mockConfig("draftsInProgress");
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
        mockConfig("draftsDoNotMark");
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

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });

    describe("awaiting review", () => {
      test("mark", async () => {
        mockConfig("draftsInProgress");
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
        mockConfig("draftsDoNotMark");
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

        await run();

        expect(setLabelsMock).toHaveBeenCalledTimes(0);
      });
    });
  });
});

["pull_request_review", "issues", "workflow_dispatch"].forEach(async (event) => {
  describe(event, () => {
    test("Not implemented", async () => {
      mockEventName.mockReturnValue(event);
      await expect(run()).rejects.toThrowError("Not implemented");
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

function mockConfig(name: string) {
  getContentMock.mockReturnValue(<any>{
    data: { content: configs[name], encoding: "utf8" },
  });
}
