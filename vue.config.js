module.exports = {
    // lintOnSave:true,
    // publicPath:'/test/ybapp/',
    devServer: {
        host: '0.0.0.0',
        proxy: {
            '/f': {
                target: 'http://test.ybapp.me/test/',
                changeOrigin: true,
                pathRewrite: function (path) { // pathRewrite: function (path, req) { return path.replace('/api', '/base/api') }
                    // console.log(path, req.id)
                    // const t = `http://test.ybapp.me/test${path.replace('/api', '')}`
                    // const t = path.replace('/api', '')
                    console.log(path)
                    return path
                }
            }
        }
    }
    // outputDir:'aaa'
    // assetsDir:'st/',
    // filenameHashing:true
}