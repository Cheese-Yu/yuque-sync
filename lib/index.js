require('dotenv-flow').config();
const Downloader = require('./download')
const GitHubClient = require('./github')
const { YUQUE_REPOS } = process.env;

async function run () {
    if (!YUQUE_REPOS) {
        throw new Error ('Need YUQUE_REPOS');
    };

    const repos = YUQUE_REPOS.split(',');
    await Promise.all(repos.map((repo) => {
        return new Promise(async(resolve) => {
            const downloader = new Downloader(repo)
            await downloader.autoUpdate();
            resolve();
        });
    }))

    const gh = new GitHubClient()
    const time = Date.now()
    await gh.writeFile('update.json', JSON.stringify({time}))
    console.log(`=========Sync finished at: ${time}!=========`)
}

run();
