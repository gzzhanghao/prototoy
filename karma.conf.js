// Karma configuration
// Generated on Sun Nov 29 2015 22:12:12 GMT+0800 (CST)

module.exports = function(config) {
  config.set({

    frameworks: ['jasmine'],

    files: [
      'test/**/*Spec.js'
    ],

    preprocessors: {
      'test/**/*Spec.js': ['webpack', 'sourcemap']
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome'],

    singleRun: false,

    webpack: {
      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015']
          }
        }]
      },
      devtool: '#inline-source-map'
    },

    webpackMiddleware: {
      noInfo: true
    }
  })
};
