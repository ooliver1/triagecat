// SPDX-License-Identifier: MIT

import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { PullRequestReviewEvent } from "@octokit/webhooks-types";
import { modifyLabels } from "../utils";

export default async function pullRequestReviewHandler(config: ConfigFile) {
  const payload = context.payload as PullRequestReviewEvent;
  const review = payload.review;

  if (payload.action === "submitted" && review.state.toLowerCase() === "approved") {
    await handleApprove(config, payload);
  }
}

async function handleApprove(config: ConfigFile, payload: PullRequestReviewEvent) {
  if (config.prs?.reviews?.required || config.prs?.reviews?.maintainers?.required) {
    if (config.labels?.awaitingMerge) {
      const mergeLabel = config.labels.awaitingMerge;
      const remove = config.labels.awaitingReview;

      if (payload.pull_request.labels.some((label) => mergeLabel === label.name)) {
        return;
      }

      const client = getOctokit(getInput("repo-token", { required: true }));

      const reviews = await client.rest.pulls.listReviews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: context.issue.number,
      });

      const had: number[] = [];
      const approvals = reviews.data.filter(
        (review) =>
          review.user &&
          review.state.toLowerCase() === "approved" &&
          !(!review.user.id || had.includes(review.user.id))
        // get unique reviews based on user id
      );

      if (config.prs.reviews.maintainers?.required) {
        const required = config.prs.reviews.maintainers.permissions || "push";

        const maintainers = [];
        for (const approval of approvals) {
          if (
            approval.user &&
            approval.user.name &&
            // octokit doesnt define permissions yet github does
            // @ts-expect-error
            (await getPerms(approval.user.name)).data.user.permissions[required]
          ) {
            maintainers.push(approval);
          }
        }

        if (maintainers.length >= config.prs.reviews.maintainers.required) {
          if (config.prs.reviews.required) {
            if (approvals.length >= config.prs.reviews.required) {
              await modifyLabels(mergeLabel, remove);
            }
          } else {
            await modifyLabels(mergeLabel, remove);
          }
        }
      } else if (
        config.prs.reviews.required &&
        approvals.length >= config.prs.reviews.required
      ) {
        await modifyLabels(mergeLabel, remove);
      }
    } else {
      throw new Error(
        "Cannot mark prs awaiting merge without specifying `labels.awaitingMerge`"
      );
    }
  }
}

async function getPerms(user: string) {
  const client = getOctokit(getInput("repo-token", { required: true }));
  return await client.rest.repos.getCollaboratorPermissionLevel({
    owner: context.repo.owner,
    repo: context.repo.repo,
    username: user,
  });
}
