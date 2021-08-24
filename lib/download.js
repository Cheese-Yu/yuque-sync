const lodash = require('lodash');
const Queue = require('queue');
const filenamify = require('filenamify');
const YuqueClient = require('./yuque');
const GitHubClient = require('./github')
const { isPost, formatRaw, formatDate } = require('./utils');

// 需要提取的文章属性字段
const PICK_PROPERTY = [
    'title',
    'description',
    'created_at',
    'updated_at',
    'published_at',
    'format',
    'slug',
    'last_editor',
];

class Downloader {
    constructor(repo) {
        this.client = new YuqueClient(repo);
        this.repo = repo;
        this.gh = new GitHubClient();
        this._cachedFiles = {};
        this._updateFiles = [];
        this.fetchArticle = this.fetchArticle.bind(this);
        this.generatePost = this.generatePost.bind(this);
        this.lastGenerate = 0;
    }

    /**
     * 下载文章详情
     *
     * @param {Object} item 文章概要
     * @param {Number} index 所在缓存数组的下标
     *
     * @return {Promise} data
     */
    fetchArticle(item, index) {
        const { client, _updateFiles } = this;
        return async function () {
            console.log(`download article body: ${item.title}`);
            const { data } = await client.getArticle(item.slug)
            _updateFiles[index] = data;
        };
    }

    /**
     * 下载所有文章
     * 并根据文章是否有更新来决定是否需要重新下载文章详情
     *
     * @return {Promise} queue
     */
    async fetchArticles() {
        const { client, _cachedFiles, _updateFiles } = this;
        const articles = await client.getArticles();
        if (!Array.isArray(articles.data)) {
            throw new Error(
                `fail to fetch article list, response: ${JSON.stringify(articles)}`
            );
        }
        console.log(`article amount: ${articles.data.length}`);
        const realArticles = articles.data
            .filter(article => !!article.status) // 已发布
            .filter(article => !!article.public) // 已公开
            .map(article => lodash.pick(article, PICK_PROPERTY));

        // 并发数
        const queue = new Queue({ concurrency: 5 });

        let file;
        let fileIndex;

        const findIndexFn = (item) => {
            return item.slug === file.slug;
        };

        for (let i = 0; i < realArticles.length; i++) {
            file = realArticles[i];
            file._fullName = `${filenamify(file.title)} ${formatDate(file.created_at)}.md`
            if (!_cachedFiles[file._fullName] && _updateFiles.findIndex(findIndexFn) < 0) {
                fileIndex = _updateFiles.length;
                _updateFiles.push(file);
                queue.push(this.fetchArticle(file, fileIndex));
            }
        }

        return new Promise((resolve, reject) => {
            queue.start(function (err) {
                if (err) return reject(err);
                console.log('========download articles done!=========');
                resolve();
            });
        });
    }

    /**
     * 读取语雀的文章缓存 json 文件
     */
     async readCache() {
        this._cachedFiles = {};
        const { status, code, data } = await this.gh.getContent(this.repo);
        if (!status) return
        this._cachedFiles = lodash.keyBy(data, 'name');
    }

    /**
     * 生成一篇 markdown 文章
     *
     * @param {Object} post 文章详情
     */
    generatePost(post) {
        const { lastGenerate, repo, gh } = this;
        return async function () {
            if (!isPost(post)) {
                console.error(`invalid post: ${post}`);
                return;
            }

            if (new Date(post.published_at).getTime() < lastGenerate) {
                console.log(`post not updated skip: ${post.title}`);
                return;
            }

            const fileName = `${filenamify(post.title)} ${formatDate(post.created_at)}.md`;
            const text = formatRaw(post.body);

            await gh.writeFile(`${repo}/${fileName}`, text)
            console.log(`updated file: ${fileName}`);
        };
    }

    /**
     * 全量生成所有 markdown 文章
     * 顺序提交，否则会冲突
     */
    async generatePosts() {
        const { _updateFiles } = this;
        const queue = new Queue({ concurrency: 1 });

        _updateFiles.forEach((post) => {
            queue.push(this.generatePost(post))
        });

        return new Promise((resolve, reject) => {
            queue.start((err) => {
                if (err) return reject(err);
                console.log('========commit files done!=========');
                resolve();
            });
        });
    }

    // 文章下载 => 增量更新文章到缓存 json 文件 => 全量生成 markdown 文章
    async autoUpdate() {
        // 获取上次更新时间
        const { data } = await this.gh.getContent('update.json')
        this.lastGenerate = data ? data.time : 0;
        await this.readCache();
        await this.fetchArticles();
        await this.generatePosts();
    }
}

module.exports = Downloader;