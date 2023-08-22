const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');


const run = async () => {
    try {
        const token = core.getInput('token');
        const deleteObsolete = core.getBooleanInput('remove-obsolete') ?? true
        let deleteSkipped = false
        try {
            deleteSkipped = core.getBooleanInput('remove-skipped') ?? false
        } catch {
            deleteSkipped = core.getMultilineInput('remove-skipped')
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
        if (deleteSkipped) {
            const skippedWorkflowRuns = workflowRuns.filter(run => {
                if (run.conclusion !== 'skipped') { return false }
                return deleteSkipped === true || deleteSkipped.includes(run.name)
            })
            core.info(`Found ${skippedWorkflowRuns.length} skipped workflow runs.`);
            idsToDelete.push(...skippedWorkflowRuns.map(run => run.id))
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
