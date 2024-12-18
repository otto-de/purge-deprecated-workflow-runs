import { describe, test } from 'node:test'
import * as assert from 'node:assert';

import {
    extract as extractOlderThanInMs,
    filterWorkflowRuns
} from '../process_older_than.js';

describe('older than input can be extracted', { concurrency: false }, () => {
    test('duration and name', () => {
        assert.deepStrictEqual(extractOlderThanInMs('1d workflow name'), {
            deleteOlderThanMs: 86400000,
            name: 'workflow name',
        })
    })

    describe('simple durations can be extracted', () => {
        for (const {duration, unit, expected} of [
            {duration: 1, unit: 's', expected: 1000},
            {duration: 1, unit: 'm', expected: 60000},
            {duration: 1, unit: 'h', expected: 3600000},
            {duration: 1, unit: 'd', expected: 86400000},
            {duration: 1, unit: 'w', expected: 604800000},
            {duration: 1, unit: 'y', expected: 31536000000},
        ]) {
            test(`${duration}, ${unit}, ${expected}`, () => {
                assert.deepStrictEqual(extractOlderThanInMs(`${duration}${unit}`), {
                    deleteOlderThanMs: expected,
                    name: '*',
                })
            })
        }
    })

    describe('combined durations can be extracted', () => {
        for (const {duration, expected} of [
            {duration: '30m1h', expected: 5400000},
            {duration: '1h15m30s', expected: 4530000},
            {duration: '1d1h15m30s', expected: 90930000},
            {duration: '1w5d', expected: 1036800000},
            {duration: '10s1y', expected: 31536010000},
        ]) {
            test(`${duration}`, () => {
                assert.deepStrictEqual(extractOlderThanInMs(duration), {
                    deleteOlderThanMs: expected,
                    name: '*',
                })
            })
        }

        test('durations of same unit are summed up', () => {
            assert.deepStrictEqual(extractOlderThanInMs('1d2d summed up to 3 days'), {
                deleteOlderThanMs: 259200000,
                name: 'summed up to 3 days',
            })
        })
    })
})

describe('workflow runs can be filtered', () => {
    test('by date', () => {
        const now = new Date()
        const deleteBefore = new Date() - 86400000
        const workflowRuns = [
            {name: 'workflow 1', created_at: deleteBefore - 10},
            {name: 'workflow 2', created_at: now - 1},
            {name: 'workflow 1', created_at: now},
            {name: 'workflow 4', created_at: now},
        ]
        const extractedOlderThanList = [
            {deleteOlderThanMs: 86400000, name: 'workflow 1'},
            {deleteOlderThanMs: 0, name: 'workflow 2'},
        ]

        assert.deepStrictEqual(filterWorkflowRuns(workflowRuns, extractedOlderThanList), [
            {name: 'workflow 1', created_at: deleteBefore - 10},
            {name: 'workflow 2', created_at: now - 1},
        ])
    })

    test('by wildcard', () => {
        const now = new Date()
        const workflowRuns = [
            {name: 'workflow 1', created_at: now - 1},
            {name: 'workflow 2', created_at: now - 10},
            {name: 'workflow 1', created_at: now - 100},
            {name: 'workflow 4', created_at: now},
        ]
        const extractedOlderThanList = [
            {deleteOlderThanMs: 9, name: '*'},
        ]

        assert.deepStrictEqual(filterWorkflowRuns(workflowRuns, extractedOlderThanList), [
            {name: 'workflow 2', created_at: now - 10},
            {name: 'workflow 1', created_at: now - 100},
        ])
    })

    test('with older timespan applied', () => {
        const now = new Date()
        const workflowRuns = [
            {name: 'workflow 1', created_at: now - 1},
            {name: 'workflow 1', created_at: now - 10},
            {name: 'workflow 1', created_at: now - 100},
        ]

        assert.deepStrictEqual(
            filterWorkflowRuns(workflowRuns, [
                {deleteOlderThanMs: 50, name: '*'},
            ]),
            [
                {name: 'workflow 1', created_at: now - 100},
            ]
        )

        assert.deepStrictEqual(
            filterWorkflowRuns(workflowRuns, [
                {deleteOlderThanMs: 5, name: '*'},
                {deleteOlderThanMs: 50, name: '*'},
                {deleteOlderThanMs: 0, name: 'some other workflow not to match'},
            ]),
            [
                {name: 'workflow 1', created_at: now - 10},
                {name: 'workflow 1', created_at: now - 100},
            ]
        )
    })

    describe('ids are extracted', () => {
        test('from workflow runs', () => {
            const now = new Date()
            const ids = []
            ids.push(...filterWorkflowRuns(
                [
                    {id: 1, name: 'workflow 1', created_at: now - 1},
                    {id: 2, name: 'workflow 1', created_at: now - 10},
                    {id: 3, name: 'workflow 1', created_at: now - 20},
                ],
                [{deleteOlderThanMs: 5, name: '*'}]
            ).map((run) => run.id))

            assert.deepStrictEqual(ids, [2, 3])
        })
    })
})
