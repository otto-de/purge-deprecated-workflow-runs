import { describe, test } from 'node:test'
import * as assert from 'node:assert';
import { getInput } from "../util.js";

describe('retrieve multiline input', { concurrency: false }, () => {
    test('ignore lines starting with hash', () => {
        process.env['INPUT_MULTILINE'] = "# comment\n1d workflow name\n"
        assert.deepStrictEqual(getInput('multiline', []), [
            '1d workflow name'
        ])
    })
})
