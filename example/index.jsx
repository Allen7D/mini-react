import React, { useState } from "react"; // 将mini-react 作为 React 来时用

// 函数组件
function Counter(props) {
  const [count, setCount] = useState(props.count);
  const [color, setColor] = useState("orange");
  const [isShow, setIsShow] = useState(true);

  return (
    <div>
      <p style={`color: ${color};`}>Count: {count}</p>
      <button onClick={() => setCount((prevCount) => prevCount + 1)}>
        累加+1
      </button>
      <button onClick={() => setCount(0)}>重置为 0</button>
      <button onClick={() => setColor(color === "green" ? "orange" : "green")}>
         改变颜色
      </button>
      <div>
        {isShow ? <p>具有隐藏或显示的功能区域</p> : ""}
        <button onClick={() => setIsShow(!isShow)}>
          {isShow ? "隐藏" : "显示"}
        </button>
      </div>
    </div>
  );
}

const element = (
  <div title="build">
    <h4>Hello World</h4>
    <Counter count={0} />
  </div>
);

const container = document.getElementById("root");

React.render(element, container);
