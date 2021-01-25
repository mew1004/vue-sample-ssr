const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')
const webpack = require('webpack')
const devMiddleware = require('webpack-dev-middleware')
const hotMiddleware = require('webpack-hot-middleware')

const resolve = file => path.resolve(__dirname, file)

module.exports = (server, callback) => {
  let ready
  const onReady = new Promise(r => ready = r)

  // 监视打包构建 -> 更新Renderer渲染器
  let template
  let serverBundle
  let clientManifest

  const update = () => {
    if (template && serverBundle && clientManifest) {
      ready()
      callback(serverBundle, template, clientManifest)
    }
  }

  //1、监视构建template -> 调用 update -> 更新Renderer渲染器
  const templatePath = path.resolve(__dirname, '../index.template.html')
  template = fs.readFileSync(templatePath, 'utf-8')
  update()
  // fs.watch、fs.watchFile
  //第三方包：chokidar
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8')
    update()
  })

  //2、监视构建serverBundle -> 调用update -> 更新Renderer渲染器
  const serverConfig = require('./webpack.server.config')
  const serverCompiler = webpack(serverConfig)
  const serverDevMiddleware = devMiddleware(serverCompiler, {
    //关闭默认日志输出，由FriendlyErrorsWebpackPlugin处理
    //4.x.x版本不支持此属性
    logLevel: 'silent'
  })
  serverCompiler.hooks.done.tap('server', () => {
    serverBundle = JSON.parse(
      //从内存当中读取文件
      serverDevMiddleware.fileSystem.readFileSync(
        resolve('../dist/vue-ssr-server-bundle.json'), 
      'utf-8')
    )
    update()
  })

  // 监视构建 clientManifest -> 调用 update -> 更新 Renderer 渲染器
  const clientConfig = require('./webpack.client.config')
  //----配置热更新----
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  clientConfig.entry.app = [
    //和服务端交互处理热更新的一个客户端脚本
    'webpack-hot-middleware/client?quiet=true&reload=true',
    clientConfig.entry.app
  ]
  // 热更新模式下确保一致的 hash
  clientConfig.output.filename = '[name].js'
  //----配置热更新----
  const clientCompiler = webpack(clientConfig)
  const clientDevMiddleware = devMiddleware(clientCompiler, {
    publicPath: clientConfig.output.publicPath,
    //关闭默认日志输出，由FriendlyErrorsWebpackPlugin处理
    //4.x.x版本不支持此属性
    logLevel: 'silent'
  })
  clientCompiler.hooks.done.tap('client', () => {
    clientManifest = JSON.parse(
      //从内存当中读取文件
      clientDevMiddleware.fileSystem.readFileSync(resolve('../dist/vue-ssr-client-manifest.json'), 'utf-8')
    )
    update()
  })

  //挂载热更新的中间件
  server.use(hotMiddleware(clientCompiler, {
    log: false // 关闭它本身的日志输出
  }))

  // 重要！将内存中的资源通过 Express 中间件对外公开访问server.use(clientDevMiddleware)
  //将 clientDevMiddleware 挂载到 Express服务中，提供其对内存中数据的访问
  server.use(clientDevMiddleware)

  return onReady
}