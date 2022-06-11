type FiberDom = HTMLElement | Text;

type FiberEffectTag = "UPDATE" | "DELETE" | "PLACEMENT";
interface ReactElement {
  type: any;
  props: ReactElementProps | null;
}
interface ReactElementProps {
  [props: string]: any;
  children?: Element[];
}

interface Fiber extends ReactElement {
  dom: FiberDom | null; // 对应真实的 DOM 节点
  parent: Fiber; // 父 Fiber
  sibling?: Fiber | null; // 下一个兄弟 Fiber
  child?: Fiber | null; // 第一个子 Fiber
  alternate: Fiber | null; // 指向旧的 fiber
  effectTag: FiberEffectTag; // fiebr 的状态（增、删、改）
  hooks?: Array<any>;
}

/**
 * 将 JSX 转为 vdom
 * @param type 元素类型
 * @param props 元素的属性
 * @param children 子节点
 * @returns
 */
function createElement(type, props, ...children) {
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
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key); // 非 children 和非事件的props
const isNew = (prev, next) => {
  return (key) => {
    return prev[key] !== next[key];
  };
};
const isGone = (prev, next) => {
  return (key) => {
    return !(key in next);
  };
};
/**
 * 创建 DOM 节点
 * @param fiber
 */
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  updateDom(dom, {}, fiber.props);

  return dom;
}

/**
 * 对比 prevProps 和 nextProps，进行 DOM 操作
 * 涉及对 DOM 属性、DOM 事件、文本节点的增｜删｜改
 * @param dom
 * @param prevProps
 * @param nextProps
 */
function updateDom(dom, prevProps, nextProps) {
  // 移除旧的事件或者被改变的事件
  // 旧的事件不在新属性中，则移除；旧的事件的回调被更改，则移除
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2); // onClick 转为 click
      dom.removeEventListener(eventType, prevProps[name]); // 移除事件监听
    });

  // 移除旧的属性
  // prevProps 的属性不在 nextProps 中，则移除
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => (dom[name] = ""));

  // 增加事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });

  // 增加属性或者更新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
}

let nextUnitOfWork: any = null; // 下一个工作单元
let currentRoot: any = null;
let wipRoot: any = null; // wip 即 workInProgress（当前进行中的工作）
let deletions: any = null;

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

  // 工作单元处理结束后，进入 commit 阶段（构建 DOM 树）
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop); // 一旦浏览器有空闲时间，就去处理任务

/**
 * 将树状的 vdom 转为链式的 fiber
 * @param fiber
 * @returns
 */
function performUnitOfWork(fiber) {
  // 判断是否函数组件
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

let wipFiber; // 目前仅用于全局一个函数组件
let hookIndex;

function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = []; // 执行函数组件前; hook 挂载在当前函数组件对应的 fiber 上

  const children = [fiber.type(fiber.props)]; //  执行函数组件，此处内部会包含 useState 执行
  reconcileChildren(fiber, children);
}

export function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] as Function[],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = <T>(action: T | ((prevState: T) => T)) => {
    let act = action;
    if (typeof action !== "function") {
      act = () => action;
    }
    hook.queue.push(act as Function);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot; // 让 workLoop 开始工作
    deletions = [];
  };

  wipFiber.hooks.push(hook);
  hookIndex++; // 基于闭包

  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  // 创建 fiber 对应的 dom 节点
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props.children || [];
  reconcileChildren(fiber, elements);
}

/**
 * 处理当前 Fiebr 的所有子节点（不涉及孙子节点）
 * 基于 oldFiber 和 elements，处理所有子节点，构建 newFiber，并对 oldFiber 做标记
 * @param wipFiber workInProgress Fiber
 * @param elements
 */
function reconcileChildren(wipFiber: Fiber, elements: ReactElement[]) {
  let index = 0; // 当前 fiber 的一群子节点的数组下标
  let oldFiber: Fiber | null =
    (wipFiber.alternate && wipFiber.alternate.child) || null; // 从旧 Fiber 的第一个子节点开始
  let prevSibling: Fiber | null = null; // 上一个子节点（当前正在处理的子节点的上一个兄弟节点）

  // 构建 fiber 的所有子节点的链表关系
  // fiber.child 指向第一个子节点，其他子节点由第一个子节点的 prevSibling 开始依次建立关联
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;
    // 更新操作：相同的节点
    if (sameType) {
      newFiber = {
        type: (oldFiber as Fiber).type,
        props: element.props,
        dom: (oldFiber as Fiber).dom, // 关联旧的 DOM 节点
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    // 新增操作：新节点存在，且新、旧节点 type 不相等
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    // 删除操作：旧节点存在，且新、旧节点 type 不相等
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETE";
      deletions.push(oldFiber); // 删除旧的 fiber
    }

    // oldFiber 指向下一个子节点，继续处理子节点
    if (oldFiber) {
      oldFiber = oldFiber.sibling || null;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      // 构建子节点的兄弟关系（当前子节点与上一个字节点）
      (prevSibling as Fiber).sibling = newFiber;
    }

    // 处理新的子节点前，将当前子节点转为上一个子节点
    prevSibling = newFiber;
    index++;
  }
}

function commitRoot() {
  deletions.forEach(commitWork); // 先处理删除操作
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

/**
 * 根据 fiber 的链表，构建 DOM 树
 * @param fiber
 * @returns
 */
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  // 针对函数组件
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  // 新增逻辑
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETE") {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child); // 不断向下处理子节点
  commitWork(fiber.sibling); // 不断向后去挂载兄弟节点
}

function commitDeletion(fiber, domParent) {
  // 函数组件，在删除节点时需要不断向下查找
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

export default {
  createElement,
  render,
  useState,
};
