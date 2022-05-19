// SPDX-License-Identifier: MIT

import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestReviewEvent } from "@octokit/webhooks-types";
import { modifyLabels } from "../utils";

export default async function pullRequestReviewHandler(config: ConfigFile) {
  const payload = context.payload as PullRequestReviewEvent;
  const review = payload.review;

  if (payload.action === "submitted" && review.state === "approved") {
    await handleApprove(config, payload);
  }
}

async function handleApprove(config: ConfigFile, payload: PullRequestReviewEvent) {
  console.log("handling");
  if (config.prs?.reviews?.required || config.prs?.reviews?.maintainers?.required) {
    console.log("configy");
    if (config?.labels?.awaitingMerge) {
      console.log("lebel");
      const mergeLabel = config.labels.awaitingMerge;
      const remove = config.labels.awaitingReview;

      if (payload.pull_request.labels.some((label) => mergeLabel === label.name)) {
        console.log("labelled");
        return;
      }

      const client = getOctokit(getInput("repo-token", { required: true }));

      const reviews = await client.rest.pulls.listReviews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.issue.number,
      });
      console.log("got reviews");

      const had: number[] = [];
      const approvals = reviews.data.filter(
        (review) =>
          review.user &&
          review.state === "approved" &&
          !(!review.user.id || had.includes(review.user.id))
        // get unique reviews based on user id
      );
      console.log(reviews.data);

      console.log(approvals.length);
      console.log(config.prs?.reviews?.required);

      if (config.prs.reviews.maintainers?.required) {
        const levels = getPermissionLevels(config.prs.reviews.maintainers.permissions);

        const maintainers = approvals.filter(async (review) => {
          review.user &&
            review.user.name &&
            levels.includes(
              (
                await client.rest.repos.getCollaboratorPermissionLevel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  username: review.user.name,
                })
              ).data.permission
            );
        });

        if (maintainers.length >= config.prs.reviews.maintainers.required) {
          if (config.prs.reviews.required) {
            if (approvals.length >= config.prs.reviews.required) {
              await modifyLabels(mergeLabel, remove);
            }
          } else {
            await modifyLabels(mergeLabel, remove);
          }
        }
      } else if (approvals.length >= config.prs.reviews.required) {
        console.log("adding");
        await modifyLabels(mergeLabel, remove);
      }
    } else {
      throw new Error(
        "Cannot mark prs awaiting merge without specifying `labels.awaitingMerge`"
      );
    }
  }
}

function getPermissionLevels(level: string | undefined) {
  if (level === "admin") {
    return ["admin"];
  } else if (level === "read") {
    return ["admin", "write", "read"];
  } else {
    return ["admin", "write"];
  }
}
