import assign from 'object-assign';
import {isEmpty, alter, has} from './util';
import frame from './frame';

var symVirt = Symbol('v-element');
var virtElems = [];
var stateVersion = 0;

class VirtualElement {

  constructor(element) {
    assign(this, {
      element: element,
      style: element.style,
      parentNode: element.parentNode,
      stateVersion: null,
      state: {},
      prevState: {},
      priority: {},
      rules: {}
    });
  }

  appendTo(parent) {
    (this.parentNode = parent).appendChild(this.element);
    return this;
  }

  insertBefore(sibling) {
    (this.parentNode = sibling.parentNode).insertBefore(this.element, sibling);
    return this;
  }

  attr(key) {
    return this.element.getAttribute(key);
  }

  prev() {
    return virtualize(this.element.previousElementSibling);
  }

  next() {
    return virtualize(this.element.nextElementSibling);
  }

  parent(selector) {
    if (!selector) {
      return virtualize(this.parentNode);
    }
    var suspects = [].slice.call(document.querySelectorAll(selector));
    var parent = this.parentNode;
    while(parent && suspects.indexOf(parent) < 0) {
      parent = parent.parentNode;
    }
    return virtualize(parent);
  }

  children() {
    return virtualize([].slice.call(this.element.children));
  }

  find(selector) {
    return virtualize(this.element.querySelector(selector));
  }

  findAll(selector) {
    return virtualize([].slice.call(this.element.querySelector(selector)));
  }

  setRule(rules, priority) {
    priority = priority | 0;
    Object.keys(rules).forEach(name => {
      if (has(this.priority, name) && this.priority[name] > priority) {
        return;
      }
      this.rules[name] = rules[name];
      this.priority[name] = priority;
    });
    return this;
  }

  getBCR() {
    if (!has(this, 'bcr')) {
      this.bcr = this.element.getBoundingClientRect();
    }
    return this.bcr;
  }

  position() {
    return this.getValue('position');
  }

  top() {
    this.checkStateVersion();
    if (has(this.state, 'top')) {
      return this.state.top;
    }
    var value = 0;
    if (has(this.rules, 'top')) {
      value = this.getValue('top');
    } else if (has(this.rules, 'bottom') && has(this.rules, 'height')) {
      value = this.getValue('bottom') - this.getValue('height');
    }
    return this.state.top = value | 0;
  }

  left() {
    if (has(this.state, 'left')) {
      return this.state.left;
    }
    var value = 0;
    if (has(this.rules, 'left')) {
      value = this.getValue('left');
    } else if (has(this.rules, 'right') && has(this.rules, 'width')) {
      value = this.getValue('right') - this.getValue('width');
    }
    return this.state.left = value | 0;
  }

  width(optional) {
    if (has(this.state, 'width')) {
      return this.state.width;
    }
    var value;
    if (has(this.rules, 'width')) {
      value = this.getValue('width');
    } else if (has(this.rules, 'right') && has(this.rules, 'left')) {
      value = this.getValue('right') - this.getValue('left');
    } else if (optional) {
      return null;
    } else {
      var bcr = this.getBCR();
      value = bcr.right - bcr.left;
    }
    return this.state.width = value | 0;
  }

  height(optional) {
    if (has(this.state, 'height')) {
      return this.state.height;
    }
    var value;
    if (has(this.rules, 'height')) {
      value = this.getValue('height');
    } else if (has(this.rules, 'bottom') && has(this.rules, 'top')) {
      value = this.getValue('bottom') - this.getValue('top');
    } else if (optional) {
      return null;
    } else {
      var bcr = this.getBCR();
      value = bcr.bottom - bcr.top;
    }
    return this.state.height = value | 0;
  }

  bottom() {
    if (has(this.state, 'bottom')) {
      return this.state.bottom;
    }
    var value;
    if (has(this.rules, 'bottom')) {
      value = this.getValue('bottom');
    } else {
      value = this.top() + this.height();
    }
    return this.state.bottom = value | 0;
  }

  right() {
    if (has(this.state, 'right')) {
      return this.state.right;
    }
    var value;
    if (has(this.rules, 'right')) {
      value = this.getValue('right');
    } else {
      value = this.left() + this.width();
    }
    return this.state.right = value | 0;
  }

  update() {
    var prevState = this.prevState;
    var left = this.left();
    var top = this.top();
    if (left !== prevState.left || top !== prevState.top) {
      this.style.transform = `translate(${left}px, ${top}px)`;
    }
    var width = this.width(true);
    if (width !== null && width !== prevState.width) {
      this.style.width = `${width}px`;
    }
    var height = this.height(true);
    if (height !== null && width !== prevState.height) {
      this.style.height = `${height}px`;
    }
    var position = this.position();
    if (position !== prevState.position) {
      this.style.position = position;
    }
  }

  checkStateVersion() {
    if (this.stateVersion === stateVersion) {
      return;
    }
    this.prevState = this.state;
    this.state = {};
    this.stateVersion = stateVersion;
  }

  getValue(name) {
    if (has(this.state, name)) {
      return this.state[name];
    }
    var value = this.rules[name];
    if (typeof value === 'function') {
      value = value.call(this, this);
    }
    return value;
  }
}

function virtualize(element) {
  if (!element) {
    return null;
  }
  if (element instanceof Array) {
    return element.map(virtualize);
  }
  if (!has(element, symVirt)) {
    virtElems.push(element[symVirt] = new VirtualElement(element));
  }
  [].slice.call(element.children).forEach(virtualize);
  return element[symVirt];
}

frame(() => {
  stateVersion = (stateVersion + 1) % 1024;
  virtElems.forEach(element => element.update());
});

export default virtualize;

