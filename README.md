# Mini React
本项目基于 React16.8，从零开始逐步构建一个涵盖 React 核心逻辑的微模型，遵循真实的 React 代码结构，但不会包含所有的优化以及非必要的功能，以此来深入学习理解 React 源码。

```bash
# 安装依赖
yarn
# 实时编译 mini-react 
yarn build
# 运行业务逻辑
yarn serve
```
## 项目初始化
本项目中，使用 rollup 作为库的打包工具来处理 mini-react，使用 webpack 作为网页应用的大包工具处理业务逻辑。

rollup 将 packages 中 mini-react 的核心逻辑编译打包到 lib 中，并支持 commonjs 规范和 esm 规范。

webpack 将 `./lib/mini-react.esm.js` 路径别名（alias）成 React，并将 `./example/index.jsx` 代码编译成 js 放在 `index.html` 中运行。

在 `index.jsx` 中，JSX 的解析转换处理是由 `babel/preset-react` 处理，webpack 会使项目中自定义的 `createElement` 方法将 JSX 解析结果(type、props、children 三个参数)转为成 vdom（虚拟DOM）。

我们会在 `packages` 文件夹中编写 mini-react 的核心逻辑，在 `./example/index.jsx` 中使用 mini-react 来验证其功能。
```
.
├── example
│   ├── index.html          // 页面模版
│   ├── index.jsx           // 业务逻辑代码
│   └── webpack.config.js   // webpack 配置
├── lib
│   ├── mini-react.cjs.js   // 支持 CommonJS 规范的模块
│   └── mini-react.esm.js   // 支持 ESModule 规范的模块
├── packages                // mini-react 核心库
│   └── index.ts        
├── rollup.config.js        // rollup 配置
├── tsconfig.json           
├── babel.config.jss
├── package.json
└── yarn.lock
├── README.md
```

## 参考
1. [build-your-own-react](https://pomb.us/build-your-own-react/)（英）—— [[译] 构建你自己的React](https://juejin.cn/post/6874246838124445703#heading-3)（中）
