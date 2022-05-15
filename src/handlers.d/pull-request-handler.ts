// SPDX-License-Identifier: MIT

import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestEvent } from "@octokit/webhooks-types";

export default async function pullRequestHandler(config: ConfigFile) {
  const payload = context.payload as PullRequestEvent;
  const pr = payload.pull_request;

  if (["opened", "converted_to_draft"].includes(payload.action) && pr.draft == true) {
    await draftHandler(config);
  } else if (
    ["opened", "ready_for_review"].includes(payload.action) &&
    pr.draft == false
  ) {
    await readyForReviewHandler(config);
  }
}

async function draftHandler(config: ConfigFile) {
  if (config.prs?.drafts?.markInProgress) {
    if (config.labels?.inProgress) {
      const remove = config.labels?.awaitingReview;
      await addLabels(config.labels.inProgress, remove);
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
      const remove = config.labels?.inProgress;
      await addLabels(config.labels.awaitingReview, remove);
    } else {
      throw new Error(
        "Cannot mark non-drafts as awaiting review without specifying " +
          "`labels.markAwaitingReview`"
      );
    }
  }
}

async function addLabels(add: string, remove: string | undefined = undefined) {
  const client = getOctokit(getInput("repo-token", { required: true }));

  const issue = await client.rest.issues.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });
  const labels = issue.data.labels.map((label) =>
    typeof label === "string"
      ? label
      : label.name
      ? label.name
      : (() => {
          throw new Error("Label name not found somehow");
        })()
  );

  labels.push(add);
  if (remove) {
    labels.splice(labels.indexOf(remove), 1);
  }

  await client.rest.issues.setLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    labels: labels,
  });
  console.log("Added", add, "to #", context.issue.number, "and removed", remove);
}
