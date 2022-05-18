# purge-workflow-runs v1

This action removes action runs from a repository when the defining action
was removed.

## Inputs
### 1. `token`
#### Required: YES
#### Default: `${{ github.token }}`
The token used to authenticate.
* Using **`github.token`** usually works, unless the actions are not scoped with `repo` rights. More details, see the [**`GITHUB_TOKEN`**](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow).
* If the workflow has issues, you may need to use a personal access token (PAT) that must have the **`repo`** scope. More details, see "[Creating a personal access token](https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)".

## Example usage

```yaml
name: Purge workflow runs
on:
    schedule:
        - cron: '54 0 * * 0'
jobs:
    purge_obsolete_workflows:
        runs-on: ubuntu-latest
        steps:
            - uses: otto-contentfactory/purge-workflow-runs@v1
              with:
                token: ${{ github.token }}
```
