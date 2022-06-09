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
 * 将渲染任务交给 requestIdleCallback
 * @param element
 * @param container
 */
export function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

/**
 * 创建 DOM 节点
 * @param fiber
 */
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key) => key !== "children"; // 非 children 的props
  // 处理属性
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

let nextUnitOfWork: any = null; // 下一个工作单元

type RequestIdleCallbackDeadline = {
  timeRemaining: () => number; // 当前帧的剩余时间
  readonly didTimeout: boolean; // 是否超时
};

/**
 * 基于 requestIdleCallback 提供的能力，在浏览器空闲时间里循环处理 fiber
 * @param deadline
 */
function workLoop(deadline: RequestIdleCallbackDeadline) {
  let shouldYield = false; // 是否要挂起（浏览器的一帧中，是否还有剩余时间）
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 不断处理
    shouldYield = deadline.timeRemaining() < 1; // 剩余时间不足 1ms，则放在下一帧中处理
  }
}

requestIdleCallback(workLoop); // 一旦浏览器有空闲时间，就去处理任务

/**
 * 将树状的 vdom 转为链式的 fiber
 * @param fiber
 * @returns
 */
function performUnitOfWork(fiber) {
  // createElement 和 appendChild 放在顶部执行的原因，当前参数 fiber 是未被处理过的（没有对应的 DOM）
  // 创建 fiber 对应的 dom 节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  // 当前处理的工作单元（当前的 fiber），将 fiebr 的 dom 挂载到父节点里
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0; // 当前 fiber 的一群子节点的数组下标
  let prevSibling: any = null; // 上一个子节点（当前正在处理的子节点的上一个兄弟节点）

  // 构建 fiber 的所有子节点的链表关系
  // fiber.child 指向第一个子节点，其他子节点由第一个子节点的 prevSibling 开始依次建立关联
  while (index < elements.length) {
    const element = elements[index];

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      // 构建子节点的兄弟关系（当前子节点与上一个字节点）
      prevSibling.sibling = newFiber;
    }

    // 处理新的子节点前，将当前子节点转为上一个子节点
    prevSibling = newFiber;
    index++;
  }
  // fiber 处理方式是深度优先后序遍历
  // 如果有子节点则优先处理子节点
  if (fiber.child) {
    return fiber.child;
  }
  // 如果子节点处理完毕，则处理兄弟节点
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 如果兄弟节点处理完毕，则处理父节点的兄弟节点
    nextFiber = nextFiber.parent;
  }
}

const React = {
  createElement,
  render,
};

export default React;
