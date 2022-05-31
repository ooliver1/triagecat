// SPDX-License-Identifier: MIT

import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";
import { load } from "js-yaml";

import ConfigFileTI from "./types/config.d-ti";
import { createCheckers, Checker } from "ts-interface-checker";

import {
  pullRequestTargetHandler,
  pullRequestReviewHandler,
  // issuesHandler,
  // workflowDispatchHandler,
  // issueCommentHandler,
} from "./handlers";

type ClientType = ReturnType<typeof getOctokit>;
const { ConfigFile } = createCheckers(ConfigFileTI) as {
  ConfigFile: Checker;
};

export default async function run() {
  const config = await getConfig(getInput("repo-token"));

  if (!context.eventName) {
    // test or smth
    return;
  }

  switch (context.eventName) {
    case "pull_request_target":
      await pullRequestTargetHandler(config);
      break;
    case "pull_request_review":
      await pullRequestReviewHandler(config);
      break;
    // case "issues":
    //   await issuesHandler(config);
    //   break;
    // case "workflow_dispatch":
    //   await workflowDispatchHandler(config);
    //   break;
    // case "issue_comment":
    //   await issueCommentHandler(config);
    //   break;
    default:
      throw new Error(`Unsupported event: ${context.eventName}`);
  }
}

async function getConfig(token: string) {
  const configFile = getInput("config") || ".github/triagecat.yml";
  try {
    const config: ConfigFile = load(
      await fetchContent(getOctokit(token), configFile)
    ) as any;
  } catch (e) {
    console.error(`Received ${e} while trying to fetch config at ${configFile}`);
    const config = {};
  }

  ConfigFile.check(config);
  return config;
}

async function fetchContent(client: ClientType, repoPath: string): Promise<string> {
  const response: any = await client.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: repoPath,
    ref: context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}
