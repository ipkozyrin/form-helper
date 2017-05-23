const webpack = require('webpack');
const merge = require('webpack-merge');

const commonConf = require('./webpack.common.config');

module.exports = merge(commonConf, {
  output: {
    filename: 'formkit-node.js',
    libraryTarget: 'commonjs',
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      // options: { context: __dirname },
      minimize: false,
    }),
  ],
});
