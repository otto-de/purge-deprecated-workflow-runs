import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { getInput } from './util.js';
import { extract as extractOlderThanInMs, filterWorkflowRuns as filterWorkflowRunsOlderThan } from './process_older_than.js';
const run2Id = (run) => run.id;
const run = async () => {
    try {
        const token = core.getInput('token') || process.env.GITHUB_TOKEN;
        const deleteObsolete = getInput('remove-obsolete', true);
        const deleteByConclusion = {
            // property names must match workflow run conclusions:
            // see: https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2022-11-28#list-workflow-runs-for-a-repository
            cancelled: getInput('remove-cancelled', false),
            failure: getInput('remove-failed', false),
            skipped: getInput('remove-skipped', false),
        };
        const deleteOlderThan = getInput('remove-older-than', [], extractOlderThanInMs);
        const { owner, repo } = github.context.repo;
        const octokit = new Octokit({ auth: token });
        const workflowIds = await (octokit.paginate('GET /repos/{owner}/{repo}/actions/workflows', {
            repo: repo,
            owner: owner,
            per_page: 100,
        }, page => page.data.map(workflow => workflow.id)));
        const workflowRuns = await octokit.paginate("GET /repos/{owner}/{repo}/actions/runs", {
            repo: repo,
            owner: owner,
            per_page: 100,
        }, page => page.data.map(run => ({
            conclusion: run.conclusion,
            created_at: run.created_at,
            id: run.id,
            name: run.name,
            workflow_id: run.workflow_id,
        })));
        const idsToDelete = [];
        if (deleteObsolete) {
            const workflowRunIdsWithoutWorkflow = workflowRuns
                .filter(run => !workflowIds.includes(run.workflow_id))
                .map(run2Id);
            core.info(`Found ${workflowRunIdsWithoutWorkflow.length} obsolete workflow runs.`);
            idsToDelete.push(...workflowRunIdsWithoutWorkflow);
        }
        for (const conclusion in deleteByConclusion) {
            const conclusionValue = deleteByConclusion[conclusion];
            if (conclusionValue) {
                const idsToDeleteByStatus = workflowRuns
                    .filter(run => {
                    if (run.conclusion !== conclusion) {
                        return false;
                    }
                    return conclusionValue === true || (run.name && conclusionValue.includes(run.name));
                })
                    .map(run2Id);
                core.info(`Found ${idsToDeleteByStatus.length} workflow runs with status [${conclusion}].`);
                idsToDelete.push(...idsToDeleteByStatus);
            }
        }
        if (deleteOlderThan.length) {
            idsToDelete.push(...filterWorkflowRunsOlderThan(workflowRuns, deleteOlderThan).map(run2Id));
        }
        const uniqueRunIdsToDelete = Array.from(new Set(idsToDelete));
        await Promise.all(uniqueRunIdsToDelete.map(run_id => octokit.request("DELETE /repos/{owner}/{repo}/actions/runs/{run_id}", {
            repo: repo,
            owner: owner,
            run_id: run_id,
        })
            .then(() => core.info("Removed run with id: " + run_id))));
    }
    catch (error) {
        core.info('Error occurred: ' + JSON.stringify({ error }));
        core.error(JSON.stringify({ error }));
    }
};
void run();
