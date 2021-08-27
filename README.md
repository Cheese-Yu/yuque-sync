# yuque-sync
通过github actions每天定时同步语雀文章到github中

### 环境配置
由于保密性，所以设置在[Secrets](https://docs.github.com/cn/actions/reference/encrypted-secrets)中
* `YUQUE_USER_TOKEN=xxx` 语雀开发者token
* `YUQUE_LOGIN=xxx` 语雀账号域名
* `YUQUE_REPOS=xxx` 语雀知识库名称，字符串类型，`,`分割
* `GH_TOKEN=xxx` github token
* `GH_LOGIN=xxx` github 账号域名
* `GH_REPO=xxx` github 项目名称
> 语雀地址 https://www.yuque.com/${client.namespace}/${post.slug}