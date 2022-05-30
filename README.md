# triagecat

[![Build and test](https://custom-icon-badges.herokuapp.com/github/workflow/status/ooliver1/triagecat/Build%20and%20test?logo=codescan-checkmark&logoColor=white)](https://github.com/ooliver1/triagecat/actions/workflows/build.yml "Build workflow")
[![Codecov coverage](https://custom-icon-badges.herokuapp.com/codecov/c/github/ooliver1/triagecat?logo=file-diff&logoColor=white)](https://app.codecov.io/gh/ooliver1/triagecat "Codecov coverage")
[![Distribution file size](https://custom-icon-badges.herokuapp.com/github/size/ooliver1/triagecat/dist/index.js?logo=file-code&logoColor=white)](https://github.com/ooliver1/triagecat/blob/master/dist/index.js "DIstribution file")
[![Lines of code](https://custom-icon-badges.herokuapp.com/tokei/lines/github/ooliver1/triagecat?logo=quote&logoColor=white)](https://github.com/ooliver1/triagecat "Repository")
[![Open issue count](https://custom-icon-badges.herokuapp.com/github/issues-raw/ooliver1/triagecat?logo=issue-opened&logoColor=white)](https://github.com/ooliver1/triagecat/issues "Open github issues")
[![Open pull requests](https://custom-icon-badges.herokuapp.com/github/issues-pr-raw/ooliver1/triagecat?logo=git-pull-request&logoColor=white)](https://github.com/ooliver1/triagecat/pulls "Open github pull requests")
[![License](https://custom-icon-badges.herokuapp.com/github/license/ooliver1/triagecat?logo=file-badge&logoColor=white)](https://github.com/ooliver1/triagecat/blob/master/LICENSE "License file")
[![Releases](https://custom-icon-badges.herokuapp.com/github/v/release/ooliver1/triagecat?display_name=tag&include_prereleases&sort=semver&logo=commit&logoColor=white)](https://github.com/ooliver1/triagecat/releases "Triagecat releases")

GitHub action to automate managing repositories with labels, milestones and projects.

- Link issues and PRs labels.
- Add issues and PRs to a project board.
- Mark issues and PRs based on state such as reviews.
- Mark PRs based on what files they edit
- Link milestone assignments to issues and PRs with labels.

## How to use

### Example action

`PAT` is stored in `settings/secrets/actions` and is a [GitHub PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `write:org` acccess if you would like triagecat to manage a beta project board on your organisation.
You most likely also need `settings/actions` `Workflow permissions` to be set to `Read and write permissions` or set the [`permissions`](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions) block in the workflow.

```yaml
on:
  issues:
    types: [opened, closed, labeled, unlabeled, milestoned, demilestoned]
  pull_request_target:
    types: [labeled, unlabeled, opened, closed, converted_to_draft, ready_for_review]
  pull_request_review:
    types: [submitted]
  issue_comment:
    types: [created]
  workflow_dispatch:

jobs:
  triagecat:
    name: Example triagecat workflow
    runs-on: ubuntu-latest
    steps:
      - uses: ooliver1/triagecat@master  # lock to version
        with:
          org-token: ${{ secrets.PAT }}
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Contributing

1. Fork the [repository](https://github.com/ooliver1/triagecat/fork)
2. Clone the repository - `git clone https://github.com/username/triagecat`
3. Change the directory name to the name of your fork - `git checkout -b username/feat/my-feature`
4. Install dependencies - `pnpm install` (or `npm install` or `yarn install`)
5. Build the project - `pnpm run build` (or `npm run build` or `yarn run build`)
6. Run tests - `pnpm test` (or `npm test` or `yarn test`)
7. Submit a [pull request](https://github.com/ooliver1/triagecat/compare)
