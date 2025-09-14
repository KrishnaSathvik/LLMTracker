const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    content: './content.js',
    inject: './inject.js',
    sw: './sw.js',
    options: './options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'options.html', to: 'options.html' },
        { from: 'README.md', to: 'README.md' }
      ]
    })
  ],
  mode: 'development'
};
