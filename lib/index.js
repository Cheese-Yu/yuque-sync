require('dotenv-flow').config();
const Downloader = require('./download')
const { YUQUE_REPOS } = process.env;
const GitHubClient = require('./github')

async function run () {
    if (!YUQUE_REPOS) return;

    const repos = YUQUE_REPOS.split(',');
    await Promise.all(repos.map((repo) => {
        return new Promise(async() => {
            const downloader = new Downloader(repo)
            await downloader.autoUpdate();
            Promise.resolve();
        });
    }))

    const gh = new GitHubClient()
    await gh.writeFile('update.json', JSON.stringify({time: Date.now()}))
    console.log('sync finished!')
}

run();