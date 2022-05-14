// SPDX-License-Identifier: MIT

import { readFile } from "fs/promises";

import { context } from "@actions/github";
import { getInput } from "@actions/core";
import { load } from "js-yaml";

import ConfigFileTI from "./types/config.d-ti";
import { createCheckers, Checker } from "ts-interface-checker";

import {
  pullRequestHandler,
  pullRequestReviewHandler,
  issuesHandler,
  workflowDispatchHandler,
} from "./handlers";

const { ConfigFile } = createCheckers(ConfigFileTI) as {
  ConfigFile: Checker;
};

export default async function run() {
  const config = await getConfig();

  switch (context.eventName) {
    case "pull_request":
      await pullRequestHandler(config);
      break;
    case "pull_request_review":
      await pullRequestReviewHandler(config);
      break;
    case "issues":
      await issuesHandler(config);
      break;
    case "workflow_dispatch":
      await workflowDispatchHandler(config);
      break;
    default:
      throw new Error(`Unsupported event: ${context.eventName}`);
  }
}

async function getConfig() {
  const configFile = getInput("config");
  const file = await readFile(configFile, "utf8");
  const config: ConfigFile = load(file) as any;
  ConfigFile.check(config);
  return config;
}
