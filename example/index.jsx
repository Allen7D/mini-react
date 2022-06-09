import React from "react"; // 将mini-react 作为 React 来时用

const element = <h4 title="build">Hello World</h4>;

const container = document.getElementById("root");

React.render(element, container);
