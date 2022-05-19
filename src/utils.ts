// SPDX-License-Identifier: MIT

import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";

export async function modifyLabels(
  add: string,
  remove: string | undefined = undefined
) {
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
