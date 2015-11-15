module.exports = {
  entry: './src/index',
  output: {
    path: 'dist',
    filename: 'bundle.min.js',
    publicPath: '/dist/',
    library: 'Layout'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader']
    }, {
      test: /\.less$/,
      loaders: ['style-loader', 'css-loader', 'less-loader']
    }, {
      test: /\.html$/,
      loaders: ['html-loader']
    }]
  },
  devtool: '#source-map',
  resolve: {
    extensions: ['', '.js', '.less', '.html']
  }
};