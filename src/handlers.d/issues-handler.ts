// SPDX-License-Identifier: MIT

import { context } from "@actions/github";
import {
  IssuesEvent,
  IssuesMilestonedEvent,
  IssuesDemilestonedEvent,
} from "@octokit/webhooks-types";
import { modifyLabels } from "../utils";

export default async function issuesHandler(config: ConfigFile) {
  const payload = context.payload as IssuesEvent;

  if (payload.action === "milestoned") {
    await handleMilestone(config, payload);
  } else if (payload.action === "demilestoned") {
    await handleDemilestone(config, payload);
  }
}

async function handleMilestone(config: ConfigFile, payload: IssuesMilestonedEvent) {
  const milestoneConfig = config.milestones?.find(
    (m) => m.milestone === payload.milestone.title
  );

  if (milestoneConfig) {
    await modifyLabels([milestoneConfig.label]);
  }
}

async function handleDemilestone(config: ConfigFile, payload: IssuesDemilestonedEvent) {
  const milestoneConfig = config.milestones?.find(
    (m) => m.milestone === payload.milestone.title
  );

  if (milestoneConfig) {
    await modifyLabels([], [milestoneConfig.label]);
  }
}
