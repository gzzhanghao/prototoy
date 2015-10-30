module.exports = {
  entry: './src/main',
  output: {
    path: 'dist',
    filename: 'bundle.min.js',
    publicPath: '/dist/'
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
  devtool: '#inline-source-map',
  resolve: {
    extensions: ['', '.js', '.less', '.html']
  }
};