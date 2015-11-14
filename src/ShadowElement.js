import assign from 'object-assign';
import {Symbol, $, $$, has, addUnit, isFunction} from './util';

var symShadow = Symbol('shadow');
var numericValues = ['top', 'left', 'right', 'bottom', 'width', 'height'];

function ShadowElement (element, scope) {
  if (!element) {
    return null;
  }
  if (has(element, symShadow)) {
    return element[symShadow];
  }
  if (!(this instanceof  ShadowElement)) {
    return new ShadowElement(element, scope);
  }
  element[symShadow] = this;
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
  this.childList = [].slice.call(element.children).map(child => ShadowElement(child, scope));
  parse(this, scope);
}

ShadowElement.prototype = {

  appendChild(child) {
    child = ShadowElement(child);
    this.childList.push(child);
    this.element.appendChild(child.element);
  },

  appendTo(parent) {
    ShadowElement(parent).appendChild(this);
  },

  prependTo(parent) {
    var childNodes = ShadowElement(parent).element.childNodes;
    if (childNodes.length) {
      this.insertBefore(childNodes[0]);
    } else {
      this.appendTo(parent);
    }
  },

  insert(child, sibling) {
    child = ShadowElement(child);
    sibling = ShadowElement(sibling);
    this.childList.splice(this.childList.indexOf(sibling), 0, child);
    this.element.insertBefore(sibling.element, child.element);
  },

  insertBefore(sibling) {
    ShadowElement(sibling).parent().insertBefore(this, sibling);
  },

  insertAfter(sibling) {
    var nextSibling = ShadowElement(sibling).element.nextSibling;
    if (nextSibling) {
      this.insertBefore(nextSibling);
    } else {
      this.appendTo(sibling.parentNode);
    }
  },

  prev() {
    return ShadowElement(this.element.previousElementSibling);
  },

  next() {
    return ShadowElement(this.element.nextElementSibling);
  },

  parent(selector) {
    var parent = this.element.parentNode;
    if (isString(selector)) {
      let suspects = $$(selector);
      while (parent && suspects.indexOf(parent) < 0) {
        parent = parent.parentNode;
      }
    }
    return ShadowElement(parent);
  },

  children() {
    return this.childList;
  },

  find(selector) {
    return ShadowElement($(selector, this.element));
  },

  findAll(selector) {
    return $$(selector, this.element).map(ShadowElement);
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

  getProperty(name) {
    if (!has(this.nextState, name)) {
      var value = this.property[name].call(this, this);
      if (numericValues.indexOf(name) >= 0) {
        value = parseFloat(value) || 0;
      }
      this.nextState[name] = value;
    }
    return this.nextState[name];
  },

  update() {
    Object.keys(this.property).forEach(name => {
      let value = this.property[name];
      if (isFunction(value)) {
        value = value.call(this, this);
      }
      this.nextState[name] = value;
    });
    this.childList.forEach(child => child.update());
  },

  apply() {
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

    this.childList.forEach(child => child.apply());
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
  }
};

function definePosition (top, height, bottom) {
  assign(ShadowElement.prototype, {

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

function parse (shadow, scope) {
  var properties = {};
  var element = shadow.element;

  var scopeName = Object.keys(scope);
  var scopeValue = scopeName.map(name => scope[name]);

  [].slice.call(element.attributes).forEach(attribute => {
    let value = attribute.value;
    let name = attribute.nodeName;
    let decorator = name.charAt(0) + name.slice(-1);

    name = name.slice(1, -1);

    if (decorator === '()') {
      on(element, name, new Function(scopeName.concat('$event'), value).bind(shadow, scopeValue));
    } else if (decorator === '{}') {
      properties[name] = new Function(scopeName, `return ${value}`).bind(shadow, scopeValue);
    } else if (decorator === '[]') {
      properties[name] = value;
    }
  });

  shadow.setProperty(properties, ShadowElement.PRIOR_INLINE);
}

definePosition('top', 'height', 'bottom');
definePosition('left', 'width', 'right');

assign(ShadowElement, {
  PRIOR_INLINE: 4,
  PRIOR_SCRIPT: 1
});

export default ShadowElement;
