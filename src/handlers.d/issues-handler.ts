// SPDX-License-Identifier: MIT

import { context } from "@actions/github";
import {
  IssuesEvent,
  IssuesMilestonedEvent,
  IssuesLabeledEvent,
  IssuesDemilestonedEvent,
  IssuesUnlabeledEvent,
} from "@octokit/webhooks-types";
import { modifyLabels } from "../utils";

export default async function issuesHandler(config: ConfigFile) {
  const payload = context.payload as IssuesEvent;

  if (payload.action === "milestoned") {
    await handleMilestone(config, payload);
  } else if (payload.action === "demilestoned") {
    await handleDemilestone(config, payload);
  } else if (payload.action === "labeled") {
    await handleLabeled(config, payload);
  } else if (payload.action === "unlabeled") {
    await handleUnlabeled(config, payload);
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

async function handleLabeled(config: ConfigFile, payload: IssuesLabeledEvent) {
  // Handle milestone addition.
  const milestoneConfig = config.milestones?.find(
    (m) => m.label === payload.label?.name
  );

  if (milestoneConfig) {
    await modifyLabels([milestoneConfig.label]);
  }
}

async function handleUnlabeled(config: ConfigFile, payload: IssuesUnlabeledEvent) {
  // Handle milestone removal.
  const milestoneConfig = config.milestones?.find(
    (m) => m.label === payload.label?.name
  );

  if (milestoneConfig) {
    await modifyLabels([], [milestoneConfig.label]);
  }
}
