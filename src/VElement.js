import util from './util';

let {assign, isNull, isFunction, isArray, isFiniteNum} = util;

const STATUS_PENDING = 0;
const STATUS_RUNNING = 1;
const STATUS_READY = 2;
const STATUS_FINISH = 3;

const EMPTY_BCR = { top: 0, right: 0, left: 0, bottom: 0, width: 0, height: 0 };

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
      value = nextState.visible = !!value;
      if (value && this.parent) {
        value = nextState.visible = this.parent.visible();
      }
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
      nodes[i].applyProps();
    }

    nodes = [this];

    // Update style
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];

      if (node.status !== STATUS_FINISH) {
        let state = node.state.style;

        if (node.nextState.style.display === 'none') {
          if (state.display !== 'none') {
            node.style.display = state.display = 'none';
          }
          continue;
        }

        node.applyStyle();
      }

      if (isArray(node.children)) {
        nodes = nodes.concat(node.children);
      }
    }

    return this;
  },

  getBCR() {
    if (!this.visible()) {
      return this.bcr = EMPTY_BCR;
    }
    this.applyProps();
    this.applyStyle();
    let bcr = this.bcr;
    if (!bcr) {
      bcr = this.element.getBoundingClientRect();
      this.bcr = { width: bcr.right - bcr.left, height: bcr.bottom - bcr.top, top: bcr.top, right: bcr.right, left: bcr.left, bottom: bcr.bottom };
    }
    return this.bcr;
  },

  applyProps() {
    if (this.status !== STATUS_PENDING) {
      return;
    }

    let self = this;
    let element = self.element;

    self.status = STATUS_RUNNING;

    {
      let nextState = self.nextState;

      let value = self.calc(self.opts.props);
      let keys = Object.keys(value);
      for (let j = keys.length - 1; j >= 0; j--) {
        VElement.properties[keys[j]](value[keys[j]], nextState);
      }
      VElement.properties.layout({
        top: self.top(), left: self.left(),
        width: self.width(true), height: self.height(true),
        visible: self.visible()
      }, nextState);
    }

    self.status = STATUS_READY;

    {
      let state = self.state.attr;
      let nextState = self.nextState.attr;

      self.state.attr = self.nextState.attr;

      let oriKeys = Object.keys(state);
      let keys = Object.keys(nextState);

      for (let j = oriKeys.length - 1; j >= 0; j--) {
        if (keys.indexOf(oriKeys[j]) < 0) {
          element.removeAttribute(oriKeys[j]);
          self.bcr = null;
        }
      }

      for (let j = keys.length - 1; j >= 0; j--) {
        let key = keys[j];
        nextState[key] = nextState[key] + '';
        if (state[key] !== nextState[key]) {
          element.setAttribute(key, nextState[key]);
          self.bcr = null;
        }
      }
    }

    {
      let state = self.state.prop;
      let nextState = self.nextState.prop;

      self.state.prop = self.nextState.prop;

      let oriKeys = Object.keys(state);
      let keys = Object.keys(nextState);

      for (let j = oriKeys.length - 1; j >= 0; j--) {
        let key = oriKeys[j];
        if (keys.indexOf(key) < 0) {
          self.bcr = null;
          if (VElement.strProps.indexOf(key) >= 0) {
            element[key] = '';
            continue;
          }
          element[key] = void 0;
          if (VElement.extProps.indexOf(key) >= 0) {
            continue;
          }
          let value = element[key];
          if (typeof value === 'string' && value !== '') {
            VElement.strProps.push(key);
            element[key] = '';
          } else {
            VElement.extProps.push(key);
          }
        }
      }

      for (let j = keys.length - 1; j >= 0; j--) {
        if (state[keys[j]] !== nextState[keys[j]]) {
          element[keys[j]] = nextState[keys[j]];
          self.bcr = null;
        }
      }
    }
  },

  applyStyle() {
    if (this.status !== STATUS_READY) {
      return;
    }

    let state = this.state.style;
    let nextState = this.nextState.style;
    let style = this.style;

    let oriKeys = Object.keys(state);
    let keys = Object.keys(nextState);

    this.status = STATUS_FINISH;
    this.state.style = this.nextState.style;

    for (let j = oriKeys.length - 1; j >= 0; j--) {
      if (keys.indexOf(oriKeys[j]) < 0) {
        style[oriKeys[j]] = '';
        this.bcr = null;
      }
    }

    for (let j = keys.length - 1; j >= 0; j--) {
      let key = keys[j];
      nextState[key] = nextState[key] + ''
      if (state[key] !== nextState[key]) {
        style[key] = nextState[key];
        this.bcr = null;
      }
    }
  },

  calc(value) {
    if (isFunction(value)) {
      value = value.call(this, this);
    }
    return value;
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

VElement.strProps = ['className', 'innerHTML', 'innerText'];
VElement.extProps = [];

VElement.e = function(name, layout, props, children, key, namespace) {
  return {
    name, key, namespace,
    layout: layout || {},
    props: props || {},
    children: children || []
  };
};

export default VElement;
