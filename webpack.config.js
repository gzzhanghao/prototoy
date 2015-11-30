var webpack = require('webpack');

module.exports = {
  entry: './src/VElement',
  output: {
    path: 'dist',
    filename: 'VElement.min.js',
    publicPath: '/dist/',
    library: 'VElement'
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
  resolve: {
    extensions: ['', '.js']
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  ]
};
