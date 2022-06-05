const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin({
      patterns: ['index.html']
    })
  ],
  devServer: {
    headers: {
      'Cross-origin-Embedder-Policy': 'require-corp',
      'Cross-origin-Opener-Policy': 'same-origin',
    }
  },
  experiments: { asyncWebAssembly: true }
};
