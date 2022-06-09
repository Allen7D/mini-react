/**
 * 将 JSX 转为 vdom
 * @param type 元素类型
 * @param props 元素的属性
 * @param children 子节点
 * @returns
 */
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children?.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

/**
 * 创建文本节点
 * @param text
 * @returns
 */
function createTextElement(child: string) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: child,
      children: [],
    },
  };
}

/**
 *
 * @param element
 * @param container
 */
export function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key) => key !== "children"; // 非 children 的props
  // 处理属性
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      console.log("name", name);
      dom[name] = element.props[name];
    });
  // 处理 children（子节点）
  element.props.children.forEach((child) => render(child, dom));
  // 挂载
  container.appendChild(dom);
}

const React = {
  createElement,
  render,
};

export default React;
