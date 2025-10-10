[![Unit Test](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml/badge.svg)](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml) ![OSS Lifecycle](https://img.shields.io/osslifecycle?file_url=https%3A%2F%2Fgithub.com%2Fotto-de%2Fpurge-deprecated-workflow-runs%2Fblob%2Fmain%2FOSSMETADATA)

# 🧹 *Purge workflow runs* action

This GH action removes action runs from a repository. Based on input parameters it can remove runs that are
obsolete, cancelled, failed, older than a given timeframe or skipped.
See input parameters below for details.

## Inputs

| Name                | Description                           | Default               | Is optional |
|---------------------|---------------------------------------|-----------------------|-------------|
| `token`             | The token used to authenticate        | `${{ github.token }}` | `true`      |
| `remove-obsolete`   | Remove obsolete workflows             | `false`               | `true`      |
| `remove-cancelled`  | Remove cancelled workflows            | `false`               | `true`      |
| `remove-failed`     | Remove failed workflows               | `false`               | `true`      |
| `remove-older-than` | Remove workflows older than timeframe | `<null>`              | `true`      |
| `remove-skipped`    | Remove skipped workflows              | `false`               | `true`      |

### Remarks on the input fields
All inputs are optional - if any input is not given, the default value will be used.

<dl>
<dt>

`token`</dt>
<dd>

- Using **`github.token`** usually works, unless the actions are not scoped with `repo` rights. For more details, see the [**`GITHUB_TOKEN`**](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow).
- If the workflow has issues, you may need to use a personal access token (PAT) that must have the **`repo`** scope. More details, see "[Creating a personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)".
</dd>
<dt>

`remove-obsolete`</dt>
<dd>

- All workflows that don't have a matching definition anymore (i.e. workflow file was removed, workflow was renamed) will be deleted
</dd>
<dt>

`remove-cancelled`</dt>
<dd>

- Remove workflows from the list that have been cancelled earlier
- Accepts either a boolean or a multiline `string`. Each line will be matched against the workflow's `name`. On match the run will be removed.
</dd>
<dt>

`remove-failed`</dt>
<dd>

- Remove workflows from the list that have failed earlier
- Accepts either a boolean or a multiline `string`. Each line will be matched against the workflow's `name`. On match the run will be removed.
</dd>
<dt>

`remove-older-than`</dt>
<dd>

- Remove workflows from the list that are older than the given timeframe (e.g. `10s`, `30m`, `12h`, `7d`, `2w`, `6y` or any combination of these (i.e. `1h30m` == `90m`)).
- Accepts a (multiline) `string`
  - Lines with a hash (`#`) as first non-whitespace character are ignored
  - Each line should follow the pattern `NU[NU[NU...]] [W]`
    - `N` is a number
    - `U` is a time unit – the following units are supported:
      - `s` for seconds
      - `m` for minutes
      - `h` for hours
      - `d` for days
      - `w` for weeks
      - `y` for years
    - `W` is the workflow name or `*` for all workflows
      - When given with `W = *` or without a workflow name, all workflows will be checked
      - When given with a workflow name, only the workflows matching the name will be checked for this timeframe
</dd>
<dt>

`remove-skipped`</dt>
<dd>

- Remove workflows from the list that have been skipped earlier
- Accepts either a boolean or a multiline `string`. Each line will be matched against the workflow's `name`. On match the run will be removed.
</dd>
</dl>

> [!IMPORTANT]
> All given inputs are applied (i.e. combined with a logical `OR`).

## Example usage

### Remove failed workflows
```yaml
name: Scheduled purge of failed workflow runs
on:
  schedule:
    - cron: '54 0 * * 0'
jobs:
  purge_obsolete_workflows:
    runs-on: ubuntu-latest
    steps:
      - uses: otto-de/purge-deprecated-workflow-runs@v4
        with:
          remove-obsolete: true
          remove-failed: true
```

### Advanced usage
The example below will trigger a run of this workflow each time a deployment status changes.
All runs until `success` will be skipped and then cleaned up in the `success` case:
```yaml
name: Manage Deployments
on:
  deployment_status:

jobs:
  clean_unfinished_deployment_status_tasks:
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'
    steps:
      - uses: otto-de/purge-deprecated-workflow-runs@v4
        with:
          # remove all orphaned workflow runs
          remove-obsolete: true
          # remove previously cancelled runs of *all* workflows
          remove-cancelled: true
          # remove failed runs of *this* workflow
          remove-failed: |
            ${{ github.workflow }}
          # remove previously skipped runs of workflows with given names
          remove-skipped: |
            Unit Tests
            Deploy
```

The following example will remove all workflow runs that are older than 4 weeks, any 'unit test' runs older than a week
and all runs of the current workflow older than 1 day:
```yaml
name: Weekly purge of workflow runs
on:
  schedule:
    - cron: '0 0 * * 0'

jobs:
    purge_old_workflows:
        runs-on: ubuntu-latest
        steps:
        - uses: otto-de/purge-deprecated-workflow-runs@v4
          with:
            remove-older-than: |
              # any workflow runs older than four weeks
              2w2w *
              # runs of 'unit test' workflow older than a week and a day
              1w1d unit test
              # runs of current workflow older than one day
              1d ${{ github.workflow }}
```
