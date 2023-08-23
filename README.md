# 🧹 *Purge workflow runs* action [![Unit Test](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml/badge.svg)](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml)

This GH action removes action runs from a repository. By default, obsolete workflow runs are deleted. Additional
filter can be applied to deleted workflow runs by status/conclusion - see input parameters below for details.

## Inputs

| Name               | Description                    | Default               | Optional |
|--------------------|--------------------------------|-----------------------|----------|
| `token`            | The token used to authenticate | `${{ github.token }}` | `true`   |
| `remove-obsolete`  | Remove obsolete workflows      | `true`                | `true`   |
| `remove-cancelled` | Remove cancelled workflows     | `false`               | `true`   |
| `remove-failed`    | Remove failed workflows        | `false`               | `true`   |
| `remove-skipped`   | Remove skipped workflows       | `false`               | `true`   |

### remarks on the input fields
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

- All workflows that don't have a matching definition anymore will be deleted
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

`remove-skipped`</dt>
<dd>

- Remove workflows from the list that have been skipped earlier
- Accepts either a boolean or a multiline `string`. Each line will be matched against the workflow's `name`. On match the run will be removed.
</dd>
</dl>

## Example usage

### Remove skipped workflows
```yaml
name: Purge deprecated workflow runs
on:
  schedule:
    - cron: '54 0 * * 0'
jobs:
  purge_obsolete_workflows:
    runs-on: ubuntu-latest
    steps:
      - uses: otto-de/purge-deprecated-workflow-runs@v1
        with:
          remove-obsolete: false
          remove-skipped: true
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
      - uses: otto-de/purge-deprecated-workflow-runs@v1
        with:
          remove-obsolete: false
          # remove failed runs of *all* workflows
          remove-failed: true
          # remove skipped runs with matching name
          remove-skipped: |
            Manage Deployments
```
