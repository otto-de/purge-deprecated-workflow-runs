type WorkflowRun = {
    conclusion: string,
    created_at: string,
    id: number,
    name: string,
    workflow_id: number,
}
type WorkflowRuns = Array<WorkflowRun>

type ExtractedOlderThan = {
    deleteOlderThanMs: number,
    name: string,
}
type ListOfExtractedOlderThan = Array<ExtractedOlderThan>

export const extract: (data: string) => ExtractedOlderThan
export const filterWorkflowRuns: (workflowRuns: WorkflowRuns, extractedOlderThanList: ListOfExtractedOlderThan) => WorkflowRuns
