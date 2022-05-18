const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');


const run = async () => {
    try {
        const token = core.getInput('token');
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

        const workflowRunsWithoutWorkflow = await octokit.paginate(
            "GET /repos/{owner}/{repo}/actions/runs",
            {
                repo: repo,
                owner: owner,
                per_page: 100,
            },
            page => page.data.map(run => ({id: run.id, workflow_id: run.workflow_id}))
        )
            .then(runs => runs.filter(run => !workflowIds.includes(run.workflow_id)));

        core.info(`Found ${workflowRunsWithoutWorkflow.length} obsolete workflow runs.`);
        await Promise.all(workflowRunsWithoutWorkflow.map(run => octokit.request(
            "DELETE /repos/{owner}/{repo}/actions/runs/{run_id}",
            {
                repo: repo,
                owner: owner,
                run_id: run.id,
            })
            .then(() => core.info("Removed run with id: " + run.id))
        ));
    } catch (error) {
        core.error(error);
    }
};

run();
