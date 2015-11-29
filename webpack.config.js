module.exports = {
  entry: './src/VElement',
  output: {
    path: 'dist',
    filename: 'bundle.min.js',
    publicPath: '/dist/',
    library: 'Layout'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
  devtool: '#source-map',
  resolve: {
    extensions: ['', '.js']
  }
};
