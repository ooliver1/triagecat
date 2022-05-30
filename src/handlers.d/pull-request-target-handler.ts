// SPDX-License-Identifier: MIT

import { context } from "@actions/github";
import { PullRequestEvent } from "@octokit/webhooks-types";
import { modifyLabels } from "../utils";

export default async function pullRequestTargetHandler(config: ConfigFile) {
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
      const remove = config.labels.awaitingReview;
      await modifyLabels(config.labels.inProgress, remove);
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
      const remove = config.labels.inProgress;
      await modifyLabels(config.labels.awaitingReview, remove);
    } else {
      throw new Error(
        "Cannot mark non-drafts as awaiting review without specifying " +
          "`labels.markAwaitingReview`"
      );
    }
  }
}
