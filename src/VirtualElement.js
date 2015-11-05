import assign from 'object-assign';
import {isEmpty, has} from './util';
import frame from './frame';
import {Symbol} from './util';

var numReg = /^\-?\d*\.?\d+$/;
var symVirtual = Symbol('virtual');
var units = {
  top: 'px', right: 'px',
  bottom: 'px', left: 'px',
  width: 'px', height: 'px'
};

class VirtualElement {

  constructor(element) {
    assign(this, {
      element,
      style: element.style,
      rules: {},
      state: {},
      priorities: {},
      nextState: {}
    });
  }

  prop(key) {
    return this.element[key];
  }

  hasProp(key) {
    return has(this.element, key);
  }

  attr(key) {
    return this.element.getAttribute(key);
  }

  hasAttr(key) {
    return this.element.hasAttribute(key);
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
    while (parent && suspects.indexOf(parent) < 0) {
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

  getBCR() {
    if (!has(this, 'bcr')) {
      this.bcr = this.element.getBoundingClientRect();
    }
    return this.bcr;
  }

  top() {
    if (has(this.nextState, 'top')) {
      return this.nextState.top;
    }
    var value = 0;
    if (has(this.rules, 'top')) {
      value = this.value('top');
    } else if (has(this.rules, 'bottom') && has(this.rules, 'height')) {
      value = this.value('bottom') - this.value('height');
    } else if (has(this.rules, 'bottom')) {
      value = this.value('bottom') - this.height();
    }
    return this.nextState.top = value;
  }

  left() {
    if (has(this.nextState, 'left')) {
      return this.nextState.left;
    }
    var value = 0;
    if (has(this.rules, 'left')) {
      value = this.value('left');
    } else if (has(this.rules, 'right') && has(this.rules, 'width')) {
      value = this.value('right') - this.value('width');
    } else if (has(this.rules, 'right')) {
      value = this.value('right') - this.width();
    }
    return this.nextState.left = value;
  }

  width(optional) {
    if (has(this.nextState, 'width')) {
      return this.nextState.width;
    }
    var value = null;
    if (has(this.rules, 'width')) {
      value = this.value('width');
    } else if (has(this.rules, 'right') && has(this.rules, 'left')) {
      value = this.value('right') - this.value('left');
    } else if (!optional) {
      var bcr = this.getBCR();
      value = bcr.right - bcr.left;
    }
    return this.nextState.width = value;
  }

  height(optional) {
    if (has(this.nextState, 'height')) {
      return this.nextState.height;
    }
    var value = null;
    if (has(this.rules, 'height')) {
      value = this.value('height');
    } else if (has(this.rules, 'bottom') && has(this.rules, 'top')) {
      value = this.value('bottom') - this.value('top');
    } else if (!optional) {
      var bcr = this.getBCR();
      value = bcr.bottom - bcr.top;
    }
    return this.nextState.height = value;
  }

  bottom() {
    if (has(this.nextState, 'bottom')) {
      return this.nextState.bottom;
    }
    var value;
    if (has(this.rules, 'bottom')) {
      value = this.value('bottom');
    } else {
      value = this.top() + this.height();
    }
    return this.nextState.bottom = value;
  }

  right() {
    if (has(this.nextState, 'right')) {
      return this.nextState.right;
    }
    var value;
    if (has(this.rules, 'right')) {
      value = this.value('right');
    } else {
      value = this.left() + this.width();
    }
    return this.nextState.right = value;
  }

  css(name, real) {
    if (!real && has(this.rules, name)) {
      return formatProp(this.value(name), name);
    }
    var value = this.style[name];
    if (value) {
      return value;
    }
    return getComputedStyle(this.element)[name];
  }

  value(name) {
    if (has(this.nextState, name)) {
      return this.nextState[name];
    }
    if (!has(this.rules, name)) {
      return;
    }
    var value = this.rules[name];
    if (typeof value === 'function') {
      value = value.call(this, this);
    }
    return this.nextState[name] = value;
  }
}

function formatProp(value, name) {
  if (has(units, name) && numReg.test(value)) {
    value = value + units[name];
  }
  return value;
}

function virtualize(element) {
  if (!element) {
    return null;
  }
  if (element instanceof Array) {
    return element.map(virtualize);
  }
  if (element instanceof VirtualElement) {
    return element;
  }
  if (!has(element, symVirtual)) {
    element[symVirtual] = new VirtualElement(element);
  }
  return element[symVirtual];
}

export {VirtualElement, virtualize};
