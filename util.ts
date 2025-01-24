import * as core from "@actions/core";

type Extractor<T> = (data: string | boolean) => T
export const getInput = <T, F extends T | T[] = T>(name: string, fallback?: F, extractor?: Extractor<T>): F extends T ? T : T[] => {
    if (!extractor) {
        extractor = (data) => data as T
    }
    if (Array.isArray(fallback)) {
        const ml = core.getMultilineInput(name)
            .filter((line) => !line.startsWith('#'))
            .map(extractor)
            .filter(Boolean)
        return (ml.length ? ml : fallback) as any
    }

    let input: string | boolean
    try {
        input = core.getBooleanInput(name)
    } catch {
        input = core.getInput(name)
    }
    if (!input) {
        return fallback as any
    }
    return extractor(input) as any
}
