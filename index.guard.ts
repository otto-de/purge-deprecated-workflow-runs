import * as core from '@actions/core'
import { Octokit } from '@octokit/rest';

type Release = {
    html_url: string
    draft: boolean
    prerelease: boolean
    tag_name: string
}
type ReleasePage = {
    pages: number,
    releases: Release[],
}

const getRepo = () => {
    const actionRepo = (process.env.GITHUB_ACTION_REPOSITORY != ''
        ? process.env.GITHUB_ACTION_REPOSITORY
        : process.env.GITHUB_REPOSITORY) ?? ''
    const [ owner, repo ] = actionRepo?.split('/') ?? [ undefined, undefined ]
    if (!owner || !repo) {
        core.debug('Failed to determine github action repository.')
    }

    return { actionRepo, owner, repo }
}

const getToken = () => {
    const token = core.getInput('token') || process.env.GITHUB_TOKEN
    if (!token) {
        core.debug('No GitHub token found. Trying to access API publicly.')
    }
    return token
}
const getReleases = async (): Promise<ReleasePage> => {
    const octokit = new Octokit({
        auth: getToken(),
    })
    const { owner, repo } = getRepo()
    if (!owner || !repo) {
        return { releases: [], pages: 0 }
    }
    return octokit.rest.repos.listReleases({ owner, repo, per_page: 10 })
        .then(( { data, headers } ) => {
            const pages = /page=(\d+)>; rel="last"/.exec(headers.link ?? '')
            const releases = data
                .map((release): Release => ({
                    draft: release.draft,
                    html_url: release.html_url,
                    prerelease: release.prerelease,
                    tag_name: release.tag_name,
                }))
            return { releases, pages: pages ? parseInt(pages[1]) : 1 }
        })
}
const isProdRelease = (release: Release) => !release.prerelease && !release.draft
const releaseToMarkdownLink = (release: Release) => `* [${release.tag_name}](${release.html_url})`

const guard = async () => {
    const { pages, releases} = await getReleases()
        .catch((error) => {
            core.warning('Failed to fetch releases from GitHub. Turn on debug messaging for more information.')
            core.error(error.message ?? error)
            return { pages: 0, releases: [] }
        })

    const { actionRepo } = getRepo()
    if (releases.length === 0) {
        core.debug(`No releases for this action (${actionRepo}) found on GitHub.`)
        return undefined
    }
    const suggestedVersion = (releases.find(isProdRelease) ?? releases[0]).tag_name
    const releaseLinks = releases.map(releaseToMarkdownLink)
    if (pages > 1) {
        releaseLinks.push(`* [...](${releases[0].html_url.split('/releases/')[0]}/releases?page=2)`)
    }

    core.summary
        .addHeading('🏷️ Only tagged releases of this action can be used in workflows', 3)
        .addRaw('Only tagged releases of this action can be used, e.g.\n', true)
        .addRaw('```yaml', true)
        .addRaw(`- uses: ${actionRepo}@${suggestedVersion}`, true)
        .addRaw('```\n', true)
        .addRaw('----\nThe following releases are available:', true)
        .addRaw(releaseLinks.join('\n'), true)

    return suggestedVersion
}
const suggestedVersion = await guard()
let errorMessage = suggestedVersion
    ? `A tagged release (e.g. ${suggestedVersion}) of this action must be used!`
    : 'A tagged release of this action must be used! Could not determine suggested version.'

core.setFailed(errorMessage + core.summary.isEmptyBuffer() ? '' : ' See summary for more details.')
core.summary.isEmptyBuffer() || void core.summary.write({overwrite: true})
