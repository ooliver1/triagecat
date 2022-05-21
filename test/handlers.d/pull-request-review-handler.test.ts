import * as core from "@actions/core";
import * as github from "@actions/github";

import pullRequestReviewHandler from "../../src/handlers.d/pull-request-review-handler";
import { mockPayload } from "../../__mocks__/@actions/github";

const gh = github.getOctokit("_");
const getIssueMock = jest.spyOn(gh.rest.issues, "get");
const setLabelsMock = jest.spyOn(gh.rest.issues, "setLabels");
const listReviewsMock = jest.spyOn(gh.rest.pulls, "listReviews");
const getCollaboratorPermissionLevelMock = jest.spyOn(
  gh.rest.repos,
  "getCollaboratorPermissionLevel"
);

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

  test("Mark with both required and maintainer requirements", async () => {
    mockPayload.mockReturnValue({
      review: {
        state: "approved",
      },
      pull_request: {
        labels: [],
      },
      action: "submitted",
    });
    listReviewsMock.mockResolvedValue(<any>{
      data: [
        {
          user: {
            name: "ooliver1",
            id: 123,
          },
          state: "approved",
        },
        {
          user: {
            name: "ooliver2",
            id: 124,
          },
          state: "approved",
        },
      ],
    });
    getCollaboratorPermissionLevelMock.mockImplementation((params, ..._) => {
      if (!params) {
        throw new Error("Why is this undefined?");
      }
      return <any>{
        data: { user: { permissions: { push: params.username === "ooliver1" } } },
      };
    });
    const config = {
      prs: { reviews: { required: 2, maintainers: { required: 1 } } },
      labels: { awaitingMerge: "awaiting merge" },
    };

    await pullRequestReviewHandler(config);

    expect(setLabelsMock).toBeCalledTimes(1);
    expect(setLabelsMock).toBeCalledWith({
      owner: "ooliver1",
      repo: "h",
      issue_number: 123,
      labels: ["awaiting merge"],
    });
  });
});
