# 🧹 *Purge deprecated workflow runs* action [![Unit Test](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml/badge.svg)](https://github.com/otto-de/purge-deprecated-workflow-runs/actions/workflows/test.yml)


This action removes action runs from a repository when the defining action
was removed.

## Inputs

| Name              | Description                    | Default        | Optional |
|-------------------|--------------------------------|----------------|----------|
| `token`           | The token used to authenticate | `github.token` | `true`   |
| `remove-obsolete` | Remove obsolete workflows      | `true`         | `true`   |
| `remove-skipped`  | Remove skipped workflows       | `false`        | `true`   |

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

* Defaults to true - this is the action's initial intent. All workflows that don't have a matching definition anymore will be deleted
</dd>
<dt>

`remove-skipped`</dt>
<dd>

* Remove workflows from the list that have been skipped earlier
</dd>
</dl>

## Example usage

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
                token: ${{ github.token }}
                remove-obsolete: false
                remove-skipped: true
```
