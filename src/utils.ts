// SPDX-License-Identifier: MIT

import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";

export async function modifyLabels(
  add: (string | undefined)[],
  remove: (string | undefined)[] | undefined = undefined
) {
  if (remove == undefined) {
    // Prevent the default from being modified.
    remove = [];
  }

  const client = getOctokit(getInput("repo-token", { required: true }));

  console.log(`Fetching labels for issue/PR ${context.issue.number}`);
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

  // incase somehow this happens, avoid duplicates
  for (const label of add) {
    if (label) {
      const index = labels.indexOf(label);
      if (index !== -1) {
        labels.splice(index, 1);
      }
    }
  }

  add.forEach((label) => {
    if (label !== undefined) {
      labels.push(label);
    }
  });

  for (const label of remove) {
    if (label) {
      const index = labels.indexOf(label);
      if (index !== -1) {
        labels.splice(index, 1);
      }
    }
  }

  await client.rest.issues.setLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    labels: labels,
  });
  console.log("Added", add, "to #", context.issue.number, "and removed", remove);
}
