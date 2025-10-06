import * as core from "@actions/core";
export const getInput = (name, fallback, extractor) => {
    if (!extractor) {
        extractor = (data) => data;
    }
    if (Array.isArray(fallback)) {
        const ml = core.getMultilineInput(name)
            .filter((line) => !line.startsWith('#'))
            .map(extractor)
            .filter(Boolean);
        return (ml.length ? ml : fallback);
    }
    let input;
    try {
        input = core.getBooleanInput(name);
    }
    catch {
        input = core.getInput(name);
    }
    if (!input) {
        return fallback;
    }
    return extractor(input);
};
