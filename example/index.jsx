import React from "react"; // 将mini-react 作为 React 来时用

const element = (
  <div style="font-size: 12px;" title="build">
    <div style="color: red;">Hello World</div>
    <div style="color: blue;">mini-react</div>
  </div>
);

const container = document.getElementById("root");

React.render(element, container);
