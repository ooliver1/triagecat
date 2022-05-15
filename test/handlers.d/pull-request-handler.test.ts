import * as core from "@actions/core";
import * as github from "@actions/github";

import pullRequestHandler from "../../src/handlers.d/pull-request-handler";
import { mockPayload } from "../../__mocks__/@actions/github";

const gh = github.getOctokit("_");
const getIssueMock = jest.spyOn(gh.rest.issues, "get");
const setLabelsMock = jest.spyOn(gh.rest.issues, "setLabels");

const mockInput: Record<string, string> = {
  "repo-token": "foo",
  "org-token": "bar",
};

jest
  .spyOn(core, "getInput")
  .mockImplementation(<any>((name: string, ..._: any[]) => mockInput[name]));

describe("Unit test drafts and non-draft labelling", () => {
  test("Raise if incorrect inProgress config", async () => {
    mockPayload.mockReturnValue({
      pull_request: {
        draft: true,
      },
      issue: {
        number: 123,
      },
      action: "converted_to_draft",
    });
    const config = { prs: { drafts: { markInProgress: true } } };
    expect(pullRequestHandler(config)).rejects.toThrowError(
      "Cannot mark drafts in progress without specifying `labels.inProgress`"
    );
  });

  test("Raise if incorrect inProgress config", async () => {
    mockPayload.mockReturnValue({
      pull_request: {
        draft: false,
      },
      issue: {
        number: 123,
      },
      action: "ready_for_review",
    });
    const config = { prs: { drafts: { markAwaitingReview: true } } };
    expect(pullRequestHandler(config)).rejects.toThrowError(
      "Cannot mark non-drafts as awaiting review without specifying " +
        "`labels.markAwaitingReview`"
    );
  });

  test("Raise if labels are somehow missing", async () => {
    mockPayload.mockReturnValue({
      pull_request: {
        draft: true,
      },
      issue: {
        number: 123,
      },
      action: "converted_to_draft",
    });
    getIssueMock.mockReturnValue(<any>{
      data: {
        labels: [{}],
      },
    });
    const config = {
      prs: { drafts: { markInProgress: true } },
      labels: { inProgress: "in progress" },
    };
    expect(pullRequestHandler(config)).rejects.toThrowError(
      "Label name not found somehow"
    );
  });

  test("Handles labels with data", async () => {
    mockPayload.mockReturnValue({
      pull_request: {
        draft: true,
      },
      issue: {
        number: 123,
      },
      action: "converted_to_draft",
    });
    getIssueMock.mockReturnValue(<any>{
      data: {
        labels: [{ name: "h" }],
      },
    });
    const config = {
      prs: { drafts: { markInProgress: true } },
      labels: { inProgress: "in progress" },
    };

    await pullRequestHandler(config);
    expect(setLabelsMock).toHaveBeenCalledTimes(1);
    expect(setLabelsMock).toHaveBeenCalledWith({
      owner: "ooliver1",
      repo: "h",
      issue_number: 123,
      labels: ["h", "in progress"],
    });
  });
});
