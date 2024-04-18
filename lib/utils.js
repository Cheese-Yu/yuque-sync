const moment = require('moment');
const lodash = require('lodash');
const axios = require('axios');
const prettier = require('prettier');

const formatMarkdown = (body) => {
    try {
        const result = prettier.format(body, {
            parser: 'markdown'
        });

        // 判断是否有图片
        const reg = /!\[(.*?)\]\((.*?)\)/g;
        const matches = result.match(reg);
        if (matches?.length) {
            matches.forEach(async(match) => {
                const src = match.match(/\((.*?)\)/)[1];
                console.log('image src:', src);
            })
        }
        return result;
    } catch (error) {
        console.error('format markdown error:', error?.message)
        return body;
    }
};

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
    const emptyAnchor = /<a name=".*?"><\/a>/g;
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
        axios.get(src, { responseType: 'text', responseEncoding: 'base64' }).then((res) => {
            // const base64 = Buffer.from(res.data, 'binary').toString('base64');
            resolve(res.data)
        }).catch((err) => {
            reject(err);
        })
    })
}
