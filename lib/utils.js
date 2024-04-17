const moment = require('moment');
const lodash = require('lodash');
const axios = require('axios');

const formatMarkdown = (() => {
    let prettier;
    try {
        prettier = require('prettier');
        return body => prettier.format(body, {
            parser: 'markdown'
        });
    } catch (error) {
        // @TODO: save to github actions logs
        // out.warn('Node 8 doesn\'t support prettier@latest (see: https://github.com/prettier/eslint-config-prettier/issues/140), the markdown will not be formated.');
        return body => body;
    }
})();

/**
 * 格式化 markdown 内容
 *
 * @param {String} body md 文档
 * @return {String} body
 */
exports.formatRaw = function (body) {
    const multiBr = /(<br>[\s\n]){2}/gi;
    const multiBrEnd = /(<br \/>[\n]?){2}/gi;
    const brBug = /<br \/>/g;
    const hiddenContent = /<div style="display:none">[\s\S]*?<\/div>/gi;
    // 删除语雀特有的锚点
    const emptyAnchor = /<a name=\".*?\"><\/a>/g;
    body = body
        .replace(hiddenContent, '')
        .replace(multiBr, '<br />')
        .replace(multiBrEnd, '<br /> \n')
        .replace(brBug, '  \n')
        .replace(emptyAnchor, '');
    return formatMarkdown(body);
}

exports.decoratePost = (title, body, url) => {
    return `# ${title}\n` + body + `\n<br>\n  \n> 语雀地址 ${url}`;
}

exports.isPost = (post) => {
    return lodash.isObject(post) && post.body && post.title;
}

exports.formatDate = (date) => {
    return moment(new Date(date).toISOString()).format('YYYY-MM-DD');
}

exports.downloadImage = (src) => {
    return new Promise((resolve, reject) => {
        axios.get(src, { responseType: 'arraybuffer' }).then((res) => {
            const base64 = Buffer.from(res.data, 'binary').toString('base64');
            resolve(base64)
        }).catch((err) => {
            reject(err);
        })
    })
  }
