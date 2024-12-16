import * as core from '@actions/core'
import { Octokit } from '@octokit/rest';

type Release = {
    html_url: string
    draft: boolean
    prerelease: boolean
    tag_name: string
}

const [ owner, repo ] = process.env.GITHUB_ACTION_REPOSITORY?.split('/') ?? [ undefined, undefined ]

async function getReleases(): Promise<Release[]> {
    const octokit = new Octokit({auth: core.getInput('token') || process.env.GITHUB_TOKEN})
    if (!owner || !repo) {
        core.debug('Failed to determine github action repository.')
        return []
    }
    return octokit.rest.repos.listReleases({ owner, repo })
        .then(({ data }) => data
            .map((release): Release => ({
                html_url: release.html_url,
                draft: release.draft,
                prerelease: release.prerelease,
                tag_name: release.tag_name,
            }))
        )
}

core.setFailed('Must use a tagged release of this action! See summary for more details.')
getReleases()
    .then((releases) => {
        if (releases.length === 0) {
            core.debug(`No releases for this action (${process.env.GITHUB_ACTION_REPOSITORY}) found on GitHub.`)
            return
        }
        const suggestedVersion = releases.find((release: Release) => !release.prerelease && !release.draft)?.tag_name ?? releases[0].tag_name
        return core.summary
            .addHeading('🏷️ Only tagged releases of this action can be used in workflows', 3)
            .addRaw('Only tagged releases of this action can be used, e.g.\n', true)
            .addRaw('```yaml', true)
            .addRaw(`- uses: ${process.env.GITHUB_ACTION_REPOSITORY}@${suggestedVersion}`, true)
            .addRaw('```\n', true)
            .addRaw('----\nThe following releases are available:', true)
            .addRaw(releases.map((release) => `* [${release.tag_name}](${release.html_url})`).join('\n'), true)
            .write({overwrite: true})
    })
    .catch(() => {
        core.debug('Failed to fetch releases from GitHub.')
    })
