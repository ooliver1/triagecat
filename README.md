# triagecat

GitHub action to automate managing repositories with labels, milestones and projects.

- Link issues and PRs labels.
- Add issues and PRs to a project board.
- Mark issues and PRs based on state such as reviews.
- Mark PRs based on what files they edit
- Link milestone assignments to issues and PRs with labels.

## How to use

### Example action

`PAT` is stored in `settings/secrets/actions` and is a [GitHub PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `write:org` acccess if you would like triagecat to manage a beta project board on your organisation.

```yaml
on:
  issues:
    types: [opened, closed, labeled, unlabeled, milestoned, demilestoned]
  pull_request:
    types: [labeled, unlabeled, opened, closed, converted_to_draft, ready_for_review]
  pull_request_review:
    types: [submitted]
  workflow_dispatch:

jobs:
  triagecat:
    name: Example triagecat workflow
    runs-on: ubuntu-latest
    steps:
      - uses: ooliver1/triagecat@master  # lock to version
        with:
          TOKEN: ${{ secrets.PAT }}
```

## Contributing

1. Fork the [repository](https://github.com/ooliver1/triagecat/fork)
2. Clone the repository - `git clone https://github.com/username/triagecat`
3. Change the directory name to the name of your fork - `git checkout -b username/feat/my-feature`
4. Install dependencies - `pnpm install` (or `npm install` or `yarn install`)
5. Build the project - `pnpm run build` (or `npm run build` or `yarn run build`)
6. Run tests - `pnpm test` (or `npm test` or `yarn test`)
7. Submit a [pull request](https://github.com/ooliver1/triagecat/compare)
