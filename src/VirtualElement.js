import assign from 'object-assign';
import {Symbol, $, $$, has, addUnit, isFunction} from 'util';

var symVirtual = Symbol('virtual');
var numericValues = ['top', 'left', 'right', 'bottom', 'width', 'height'];
var locatingProps = ['top', 'left', 'right', 'bottom', 'width', 'height'];

function VirtualElement (element) {
  if (!element) {
    return null;
  }
  if (has(element, symVirtual)) {
    return element[symVirtual];
  }
  if (!(this instanceof  VirtualElement)) {
    return new VirtualElement(element);
  }
  element[symVirtual] = this;
  assign(this, {
    element,
    style: element.style,
    state: {},
    nextState: {},
    priority: {},
    property: {},
    styleCache: {},
    attrCache: {},
    propCache: {},
    posCache: {},
    bcrCache: null,
    computedStyle: false
  });
}

VirtualElement.prototype = {

  appendTo(parent) {
    parent.appendChild(this.element);
  },

  prependTo(parent) {
    var childNodes = parent.childNodes;
    if (childNodes.length) {
      this.insertBefore(childNodes[0]);
    } else {
      this.appendTo(parent);
    }
  },

  insertBefore(sibling) {
    sibling.parentNode.insertBefore(this.element, sibling);
  },

  insertAfter(sibling) {
    var nextSibling = sibling.nextSibling;
    if (nextSibling) {
      this.insertBefore(nextSibling);
    } else {
      this.appendTo(sibling.parentNode);
    }
  },

  prev() {
    return VirtualElement(this.element.previousElementSibling);
  },

  next() {
    return VirtualElement(this.element.nextElementSibling);
  },

  parent(selector) {
    var parent = this.element.parentNode;
    if (isString(selector)) {
      let suspects = $$(selector);
      while (parent && suspects.indexOf(parent) < 0) {
        parent = parent.parentNode;
      }
    }
    return VirtualElement(parent);
  },

  children() {
    return [].map.call(this.element.children, VirtualElement);
  },

  find(selector) {
    return VirtualElement($(selector, this.element));
  },

  findAll(selector) {
    return $$(selector, this.element).map(VirtualElement);
  },

  attr(key) {
    if (!has(this.attrCache, key)) {
      this.attrCache[key] = this.element.getAttribute(key);
    }
    return this.attrCache[key];
  },

  hasAttr(key) {
    return this.element.hasAttribute(key);
  },

  prop(key) {
    if (!has(this.propCache, key)) {
      this.propCache[key] = this.element[key];
    }
    return this.propCache[key];
  },

  css(name) {
    if (has(this.styleCache, name)) {
      return this.styleCache[name];
    }
    var value;
    if (has(this.property, name)) {
      value = addUnit(name, this.getProperty(name));
    } else {
      value = this.realCSS(name);
    }
    return this.styleCache[name] = value;
  },

  realCSS(name) {
    if (!this.computedStyle) {
      var value = this.style[name];
      if (value) {
        return value;
      }
    }
    return this.getComputedStyle()[name];
  },

  setProperty(properties, priority) {
    Object.keys(properties).forEach(name => {
      if ((this.priority[name] | 0) <= priority) {
        this.property[name] = properties[name];
        this.priority[name] = priority;
      }
    });
  },

  update() {
    Object.keys(this.property).forEach(name => {
      let value = this.property[name];
      if (isFunction(value)) {
        value = value.call(this, this);
      }
      this.nextState[name] = value;
    });
  },

  digest() {
    assign(this.nextState, { top: this.top() | 0, left: this.left() | 0 });
    var width = this.width(true);
    if (width !== null) {
      this.nextState.width = width | 0;
    }
    var height = this.height(true);
    if (height !== null) {
      this.nextState.height = height | 0;
    }
    delete this.nextState.right;
    delete this.nextState.bottom;

    Object.keys(this.state).forEach(name => {
      if (!has(this.nextState, name)) {
        this.style[name] = '';
        delete this.state[name];
      }
    });

    Object.keys(this.nextState).forEach(name => {
      if (!has(this.state, name) || this.state[name] !== this.nextState[name]) {
        this.state[name] = this.nextState[name];
        this.style[name] = addUnit(name, this.state[name]);
      }
    });

    assign(this, {
      nextState: {},
      styleCache: {},
      attrCache: {},
      propCache: {},
      posCache: {},
      bcrCache: null,
      computedStyle: false
    });
  },

  getBCR() {
    if (!this.bcrCache) {
      this.bcrCache = this.element.getBoundingClientRect();
    }
    return this.bcrCache;
  },

  getComputedStyle() {
    if (!this.computedStyle) {
      this.computedStyle = getComputedStyle(this.element);
    }
    return this.computedStyle;
  },

  getProperty(name) {
    if (!has(this.nextState, name)) {
      var value = this.property[name].call(this, this);
      if (numericValues.indexOf(name) >= 0) {
        value = parseFloat(value) || 0;
      }
      this.nextState[name] = value;
    }
    return this.nextState[name];
  }
};

function definePosition(top, height, bottom) {
  assign(VirtualElement.prototype, {

    [top]() {
      if (has(this.posCache, top)) {
        return this.posCache[top];
      }
      var value = 0;
      if (has(this.property, top)) {
        value = this.getProperty(top);
      } else if (has(this.property, bottom)) {
        value = this[bottom]() - this[height]();
      }
      return this.posCache[top] = value;
    },

    [height](optional) {
      if (has(this.posCache, height)) {
        return this.posCache[height];
      }
      var value;
      if (has(this.property, height)) {
        value = this.getProperty(height);
      } else if (has(this.property, top) && has(this.property, bottom)) {
        value = this[bottom]() - this[top]();
      } else if (!optional) {
        var bcr = this.getBCR();
        value = bcr[bottom] - bcr[top];
      }
      return this.posCache[height] = value;
    },

    [bottom]() {
      if (has(this.posCache, bottom)) {
        return this.posCache[bottom];
      }
      var value;
      if (has(this.property, bottom)) {
        value = this.getProperty(bottom);
      } else {
        value = this[top]() + this[height]();
      }
      return this.posCache[bottom] = value;
    }
  });
}

definePosition('top', 'height', 'bottom');
definePosition('left', 'width', 'right');

export default VirtualElement;
