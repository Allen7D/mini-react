import React from "react"; // 将mini-react 作为 React 来时用

// 函数组件
function App(props) {
  return <h4>Hi {props.name}</h4>;
}

function handleClick() {
  console.log("click");
}

const element = (
  <div>
    <App name="foo" />
    <div style="font-size: 12px;" title="build">
      <div style="color: red;">Hello World</div>
      <div style="color: blue;">mini-react</div>
      <button onClick={handleClick}>点击</button>
    </div>
  </div>
);

const container = document.getElementById("root");

React.render(element, container);
