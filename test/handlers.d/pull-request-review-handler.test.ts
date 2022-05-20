import * as core from "@actions/core";
import * as github from "@actions/github";

import pullRequestReviewHandler from "../../src/handlers.d/pull-request-review-handler";
import { mockPayload } from "../../__mocks__/@actions/github";

const gh = github.getOctokit("_");
const getIssueMock = jest.spyOn(gh.rest.issues, "get");

const mockInput: Record<string, string> = {
  "repo-token": "foo",
  "org-token": "bar",
};

jest
  .spyOn(core, "getInput")
  .mockImplementation(<any>((name: string, ..._: any[]) => mockInput[name]));

describe("Unit required review and maintainer review labelling", () => {
  test("Do not mark if already awaiting merge", async () => {
    getIssueMock.mockReturnValue(<any>{
      data: {
        labels: ["awaiting merge"],
      },
    });
    mockPayload.mockReturnValue(<any>{
      action: "submitted",
      review: {
        state: "approved",
      },
      pull_request: {
        labels: [{ name: "awaiting merge" }],
      },
    });

    const config = {
      prs: { reviews: { required: 1 } },
      labels: { awaitingMerge: "awaiting merge" },
    };

    await pullRequestReviewHandler(config);
  });

  test("Raise if incorrect inProgress config", async () => {
    mockPayload.mockReturnValue({
      review: {
        state: "approved",
      },
      action: "submitted",
    });
    const config = { prs: { reviews: { required: 1 } } };
    expect(pullRequestReviewHandler(config)).rejects.toThrowError(
      "Cannot mark prs awaiting merge without specifying `labels.awaitingMerge`"
    );
  });
});
