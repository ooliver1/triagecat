// SPDX-License-Identifier: MIT

import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestEvent } from "@octokit/webhooks-types";

export default async function pullRequestHandler(config: ConfigFile) {
  console.log("pullRequestHandler");
  const payload = context.payload as PullRequestEvent;
  const pr = payload.pull_request;
  console.log(payload);

  if (["opened", "converted_to_draft"].includes(payload.action) && pr.draft == true) {
    await draftHandler(config);
  } else if (payload.action in ["ready_for_review"]) {
    await readyForReviewHandler(config);
  }
}

async function draftHandler(config: ConfigFile) {
  console.log("draftHandler");
  if (config.prs?.drafts?.markInProgress) {
    console.log("Marking PR as in progress");
    if (config.labels?.inProgress) {
      console.log("Adding in progress label");
      const client = getOctokit(getInput("TOKEN", { required: true }));

      client.rest.issues.addLabels({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
        labels: [config.labels.inProgress],
      });
      console.log("Added in progress label");
    } else {
      throw new Error(
        "Cannot mark drafts in progress without specifying `labels.inProgress`"
      );
    }
  }
}

async function readyForReviewHandler(_: ConfigFile) {}
