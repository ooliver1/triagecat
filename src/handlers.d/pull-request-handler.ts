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
  if (config.prs?.drafts?.markInProgress) {
    if (config.labels?.inProgress) {
      await addLabels(config.labels.inProgress);
    } else {
      throw new Error(
        "Cannot mark drafts in progress without specifying `labels.inProgress`"
      );
    }
  }
}

async function readyForReviewHandler(config: ConfigFile) {
  if (config.prs?.drafts?.markAwaitingReview) {
    if (config.labels?.awaitingReview) {
      await addLabels(config.labels.awaitingReview);
    } else {
      throw new Error(
        "Cannot mark non-drafts as awaiting review without specifying " +
          "`labels.markAwaitingReview`"
      );
    }
  }
}

async function addLabels(...labels: string[]) {
  const client = getOctokit(getInput("repo-token", { required: true }));

  client.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    labels: labels,
  });
}
