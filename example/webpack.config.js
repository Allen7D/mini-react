const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpackPromptPlugin = require("webpack-prompt-plugin");

const resolve = function (dir) {
  return path.resolve(__dirname, dir);
};

module.exports = {
  mode: "development",
  entry: "./example/index.jsx",
  output: {
    path: resolve("dist"),
    filename: "[name]-[hash].js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: "babel-loader",
        query: {
          compact: false,
        },
      },
    ],
  },
  resolve: {
    alias: {
      react: resolve("../lib/mini-react.esm"), // 将 lib/mini-react.esm.js 映射为 react
    },
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
  devServer: {
    host: "0.0.0.0", // 默认是localhost，只能本地访问
    port: 8090, // 启动服务器端口
    open: true, // 自动打开浏览器
    hot: true, // 启用模块热替换
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./example/index.html",
      filename: "index.html",
      inject: true,
      title: "mini-react",
    }),
    new webpackPromptPlugin(),
  ],
};
