const durationUnitToMs = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
    w: 604800000,
    y: 31536000000,
}

export const extract = (data) => {
    const [since, ...nameSlices] = data.split(' ')
    const workflowName = nameSlices.length
        ? nameSlices.join(' ')
        : '*'
    let total = 0
    if (since.match(/^(\d+[smhdwy])+$/)) {
        const durations = [...since.matchAll(/\d+[smhdwy]/g)]
        total = durations
            .map((duration) => parseInt(duration[0].slice(0, -1)) * durationUnitToMs[duration[0].slice(-1)])
            .reduce((p, c) => p + c, total)
    }

    return {
        deleteOlderThanMs: total,
        name: workflowName,
    }
}

export const filterWorkflowRuns = (workflowRuns, extractedOlderThanList) => {
    const now = new Date()
    const olderThan = extractedOlderThanList
        .map((since) => ({
            deleteOlderThanDate: new Date(now - since.deleteOlderThanMs),
            name: since.name,
        }))

    return workflowRuns
        .filter((run) => olderThan
            .find((extractedInput) => {
                if (extractedInput.name !== '*' && extractedInput.name !== run.name) {
                    return false
                }
                return new Date(run.created_at) < extractedInput.deleteOlderThanDate
            })
        )
}
