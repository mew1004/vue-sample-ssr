const express = require('express');
const fs = require('fs');
const { createBundleRenderer } = require('vue-server-renderer');
const setupDevServer = require('./build/setup-dev-server');

const server = express();

//在服务端开放静态资源，否则客户端无法获取资源
//使用express的static中间件处理静态资源,请求前缀应该和打包出口的publicPath保持一致，
//express.static处理的物理磁盘里的文件
server.use('/dist', express.static('./dist'));

const isProd = process.env.NODE_ENV === 'production';

let renderer;
let onReady; //标记开发模式下，构建是否完成
if (isProd) {
  //生产模式
  const serverBundle = require('./dist/vue-ssr-server-bundle.json');
  const clientManifest = require('./dist/vue-ssr-client-manifest.json');
  const template = fs.readFileSync('./index.template.html', 'utf-8'); //使用utf-8进行编码的index.html作为渲染模板
  renderer = createBundleRenderer(serverBundle, {
    template,
    clientManifest
  });
} else {
  //开发模式 -> 监视打包构建 -> 重新生成renderer渲染器
  onReady = setupDevServer(server, (serverBundle, template, clientManifest) => {
    renderer = createBundleRenderer(serverBundle, {
      template,
      clientManifest
    })
  });
}

const render = async (req, res) => {
  //将模板转换为字符串，并发送给客户端
  try {
    const html = await renderer.renderToString({
      title: '拉勾教育',
      meta: `<meta name="description" content="拉勾教育">`,
      url: req.url
    })
    res.setHeader('Content-Type', 'text/html; charset=utf8')
    res.end(html)
  } catch (err) {
    console.log('---aaa---', err);
    res.status(500).end('Internal Server Error.')
  }
};

//服务端路由设置为*，意味着匹配所有的路由
server.get('*', isProd ?
  render :
  async (req, res) => {
    //等待有了renderer 渲染器以后，调用 render 进行渲染
    await onReady;
    render(req, res);
  }
)

//启动web服务
server.listen(3000, () => {
  console.log('server running...')
})