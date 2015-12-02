import util from './util';

let {assign, isNull, isFunction, isArray, isFiniteNum} = util;

const STATUS_PENDING = 0;
const STATUS_RUNNING = 1;
const STATUS_READY = 2;
const STATUS_FINISH = 3;

function VElement(opts) {
  let self = this;

  self.opts = opts;
  self.state = { attr: {}, style: {}, prop: {}, children: [] };

  if (opts.namespace) {
    self.element = document.createElementNS(opts.namespace, opts.name);
  } else {
    self.element = document.createElement(opts.name);
  }
  self.style = self.element.style;

  let children = opts.children;

  self.state.children = children.map(child => {
    if (isArray(child) || isFunction(child)) {
      child = { element: document.createComment('list'), elements: [] };
    } else {
      child = new VElement(child);
    }
    self.element.appendChild(child.element);
    child.parent = self;
    return child;
  });
}

[['top', 'height', 'bottom'], ['left', 'width', 'right']].forEach(properties => {
  let top = properties[0];
  let height = properties[1];
  let bottom = properties[2];

  assign(VElement.prototype, {

    [top]() {
      if (!this.visible()) {
        return 0;
      }
      let nextState = this.nextState.layout;
      if (isNull(nextState[top])) {
        let value = this.calc(this.opts.layout[top]);
        if (!isFiniteNum(value)) {
          value = 0;
        }
        nextState[top] = +value;
      }
      return nextState[top];
    },

    [height](optional) {
      if (!this.visible()) {
        return 0;
      }
      let nextState = this.nextState.layout;
      if (isNull(nextState[height])) {
        let value = this.calc(this.opts.layout[height]);
        if (!isFiniteNum(value)) {
          if (optional) {
            return;
          }
          value = this.getBCR()[height];
        }
        nextState[height] = +value;
      }
      return nextState[height];
    },

    [bottom]() {
      let nextState = this.nextState.layout;
      if (isNull(nextState[bottom])) {
        nextState[bottom] = this[top]() + this[height]();
      }
      return nextState[bottom];
    }
  });
});

assign(VElement.prototype, {

  appendTo(parent) {
    parent.appendChild(this.element);
    return this;
  },

  insertBefore(sibling) {
    sibling.parentNode.insertBefore(this.element, sibling);
    return this;
  },

  replace(landmark) {
    landmark.parentNode.replaceChild(this.element, landmark);
    return this;
  },

  visible() {
    let nextState = this.nextState.layout;
    let value = nextState.visible;
    if (isNull(value)) {
      nextState.visible = true;
      value = this.calc(this.opts.layout.visible);
      if (isNull(value)) {
        value = true;
      }
      value = !!value;
      nextState.visible = value;
    }
    if (value && this.parent) {
      return this.parent.visible();
    }
    return value;
  },

  update(newOpts) {
    let nodes = [this];

    if (newOpts) {
      this.opts = newOpts;
    }

    // Update DOM structure
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];

      node.status = STATUS_PENDING;
      node.nextState = { attr: {}, style: {}, prop: {}, layout: {} };

      let state = node.state.children;
      let opts = node.opts.children;
      let children = [];

      for (let j = opts.length - 1; j >= 0; j--) {
        if (!isArray(opts[j]) && !isFunction(opts[j])) {
          state[j].opts = opts[j];
          children.unshift(state[j]);
          continue;
        }

        let index = 0;
        let elements = state[j].elements;
        let parent = node.element;
        let keys = elements.map(child => child.opts.key);
        let child = opts[j];

        if (isFunction(child)) {
          child = child();
        }

        state[j].elements = child.map(child => {
          let oriIdx = keys.indexOf(child.key, index);
          if (oriIdx < 0) {
            return new VElement(child).insertBefore(
              index < elements.length ?
                elements[index].element :
                state[j].element
            );
          }
          while (index < oriIdx) {
            parent.removeChild(elements[index++].element);
          }
          elements[index].opts = child;
          return elements[index++];
        });
        children = state[j].elements.concat(children);

        for (let k = elements.length - 1; k >= index; k--) {
          parent.removeChild(elements[k].element);
        }
      }

      nodes = nodes.concat(children);
      nodes[i].children = children;

      for (let j = children.length - 1; j >= 0; j--) {
        children[j].prev = children[j - 1];
        children[j].next = children[j + 1];
        children[j].parent = nodes[i];
      }
    }

    // Apply properties and update attributes
    for (let i = nodes.length - 1; i >= 0; i--) {
      let node = nodes[i];

      node.status = STATUS_RUNNING;
      {
        let nextState = node.nextState;

        let value = node.calc(node.opts.props);
        let keys = Object.keys(value);
        for (let j = keys.length - 1; j >= 0; j--) {
          VElement.properties[keys[j]](value[keys[j]], nextState);
        }
        VElement.properties.layout({
          top: node.top(), left: node.left(),
          width: node.width(true), height: node.height(true),
          visible: node.visible()
        }, nextState);
      }
      node.status = STATUS_READY;

      let element = node.element;

      {
        let state = node.state.attr;
        let nextState = node.nextState.attr;

        node.state.attr = node.nextState.attr;

        let oriKeys = Object.keys(state);
        let keys = Object.keys(nextState);

        for (let j = oriKeys.length - 1; j >= 0; j--) {
          if (keys.indexOf(oriKeys[j]) < 0) {
            element.removeAttribute(oriKeys[j]);
            node.bcr = null;
          }
        }

        for (let j = keys.length - 1; j >= 0; j--) {
          let key = keys[j];
          nextState[key] = nextState[key] + '';
          if (state[key] !== nextState[key]) {
            element.setAttribute(key, nextState[key]);
            node.bcr = null;
          }
        }
      }

      {
        let state = node.state.prop;
        let nextState = node.nextState.prop;

        node.state.prop = node.nextState.prop;

        let oriKeys = Object.keys(state);
        let keys = Object.keys(nextState);

        for (let j = oriKeys.length - 1; j >= 0; j--) {
          let key = oriKeys[j];
          if (keys.indexOf(key) < 0) {
            node.bcr = null;
            if (VElement.stringProperties.indexOf(key) >= 0) {
              element[key] = '';
              continue;
            }
            element[key] = void 0;
            if (VElement.externProperties.indexOf(key) >= 0) {
              continue;
            }
            let value = element[key];
            if (typeof value === 'string' && value !== '') {
              VElement.stringProperties.push(key);
              element[key] = '';
            } else {
              VElement.externProperties.push(key);
            }
          }
        }

        for (let j = keys.length - 1; j >= 0; j--) {
          if (state[keys[j]] !== nextState[keys[j]]) {
            element[keys[j]] = nextState[keys[j]];
            node.bcr = null;
          }
        }
      }
    }

    nodes = [this];

    // Update style
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];

      let state = node.state.style;
      let nextState = node.nextState.style;

      node.state.style = node.nextState.style;

      if (nextState.display === 'none') {
        if (state.display !== 'none') {
          node.style.display = state.display = 'none';
          let children = [node];
          for (let j = 0; j < children.length; j++) {
            children[j].bcr = { top: 0, right: 0, left: 0, bottom: 0, width: 0, height: 0 };
            if (isArray(children[j].children)) {
              children = children.concat(children[j].children);
            }
          }
        }
        continue;
      }

      let oriKeys = Object.keys(state);
      let keys = Object.keys(nextState);

      for (let j = oriKeys.length - 1; j >= 0; j--) {
        if (keys.indexOf(oriKeys[j]) < 0) {
          node.style[oriKeys[j]] = '';
          node.bcr = null;
        }
      }

      for (let j = keys.length - 1; j >= 0; j--) {
        let key = keys[j];
        nextState[key] = nextState[key] + ''
        if (state[key] !== nextState[key]) {
          node.style[key] = nextState[key];
          node.bcr = null;
        }
      }

      if (isArray(node.children)) {
        nodes = nodes.concat(node.children);
      }
    }

    return this;
  },

  calc(value) {
    if (isFunction(value)) {
      value = value.call(this, this);
    }
    return value;
  },

  getBCR() {
    let bcr = this.bcr;
    if (!bcr) {
      bcr = this.element.getBoundingClientRect();
      this.bcr = { width: bcr.right - bcr.left, height: bcr.bottom - bcr.top, top: bcr.top, right: bcr.right, left: bcr.left, bottom: bcr.bottom };
    }
    return this.bcr;
  }
});

VElement.properties = {

  layout(config, { style }) {
    style.position = style.position || 'absolute';
    style.top = style.left = 0;
    style.transform = `translate(${config.left | 0}px, ${config.top | 0}px) ${style.transform || ''}`;
    if (isFiniteNum(config.width)) {
      style.width = `${config.width | 0}px`;
    }
    if (isFiniteNum(config.height)) {
      style.height = `${config.height | 0}px`;
    }
    if (!config.visible) {
      style.display = 'none';
    }
  },

  className(config, { prop }) {
    let list = config.list;
    if (!isArray(list)) {
      list = [list];
    }
    prop.className = list.map(v => {
      if (typeof v === 'object' && !isNull(v)) {
        v = Object.keys(v).filter(k => v[k]);
      }
      return v;
    }).join(' ')
  },

  content(config, { prop }) {
    if (!isNull(config.html)) {
      prop.innerHTML = '' + config.html;
    } else if (!isNull(config.text)) {
      prop.innerText = '' + config.text;
    }
  }
};

VElement.stringProperties = ['className', 'innerHTML', 'innerText'];
VElement.externProperties = [];

VElement.e = function(name, layout, props, children, key, namespace) {
  return {
    name, key, namespace,
    layout: layout || {},
    props: props || {},
    children: children || []
  };
};

export default VElement;
