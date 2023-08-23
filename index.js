const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');


const getInput = (name, fallback = undefined) => {
    try {
        return core.getBooleanInput(name) ?? fallback
    } catch {
        const ml = core.getMultilineInput(name)
        return ml.length ? ml : fallback
    }
}

const run = async () => {
    try {
        const token = core.getInput('token') || process.env.GITHUB_TOKEN;
        const deleteObsolete = getInput('remove-obsolete', true)
        const deleteByStatus = {
            // property names must match workflow run conclusions:
            // see: https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
            cancelled: getInput('remove-cancelled', false),
            failure: getInput('remove-failed', false),
            skipped: getInput('remove-skipped', false),
        }
        const {owner, repo} = github.context.repo;
        const octokit = new Octokit({auth: token});

        const workflowIds = await (octokit.paginate(
            'GET /repos/{owner}/{repo}/actions/workflows',
            {
                repo: repo,
                owner: owner,
                per_page: 100,
            },
            page => page.data.map(workflow => workflow.id)
        ));

        const workflowRuns = await octokit.paginate(
            "GET /repos/{owner}/{repo}/actions/runs",
            {
                repo: repo,
                owner: owner,
                per_page: 100,
            },
            page => page.data.map(run => ({
                conclusion: run.conclusion,
                id: run.id,
                name: run.name,
                workflow_id: run.workflow_id,
            }))
        )
        const idsToDelete = []
        if (deleteObsolete) {
            const workflowRunsWithoutWorkflow = workflowRuns.filter(run => !workflowIds.includes(run.workflow_id));
            core.info(`Found ${workflowRunsWithoutWorkflow.length} obsolete workflow runs.`);
            idsToDelete.push(...workflowRunsWithoutWorkflow.map(run => run.id))
        }

        for (const status in deleteByStatus) {
            if (deleteByStatus[status]) {
                const IdsToDeleteByStatus = workflowRuns.filter(run => {
                    if (run.conclusion !== status) { return false }
                    return deleteByStatus[status] === true || deleteByStatus[status].includes(run.name)
                })
                core.info(`Found ${IdsToDeleteByStatus.length} workflow runs with status [${status}].`);
                idsToDelete.push(...IdsToDeleteByStatus.map(run => run.id))
            }
        }

        const uniqueRunIdsToDelete = [...new Set(idsToDelete)]
        await Promise.all(uniqueRunIdsToDelete.map(run_id => octokit.request(
            "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}",
            {
                repo: repo,
                owner: owner,
                run_id: run_id,
            })
            .then(() => core.info("Removed run with id: " + run_id))
        ));
    } catch (error) {
        core.error(error);
    }
};

run();
