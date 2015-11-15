import assign from 'object-assign';
import {Symbol, $, $$, has, addUnit, isFunction, isUndefined, bind, unset} from './util';

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
    priorities: {},
    properties: {},
    patch: {},
    state: { position: 'absolute', top: 0, left: 0 },
    childList: [].slice.call(element.children).map(child => ShadowElement(child, scope))
  });

  assign(this.style, this.state);

  this.clearState();

  var properties = {};

  var scopeName = Object.keys(scope);
  var scopeValue = scopeName.map(name => scope[name]);

  [].slice.call(element.attributes).forEach(attribute => {
    let value = attribute.value;
    let name = attribute.nodeName;
    let decorator = name.charAt(0) + name.slice(-1);

    name = name.slice(1, -1);

    if (decorator === '()') {
      on(element, name, bind(new Function(scopeName.concat('$event'), value), this, scopeValue));
    } else if (decorator === '{}') {
      properties[name] = bind(new Function(scopeName, `return ${value}`), this, scopeValue);
    } else if (decorator === '[]') {
      properties[name] = value;
    }
  });

  this.setProperty(properties, ShadowElement.PRIOR_INLINE);
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
    var styleCache = this.styleCache;
    if (!has(styleCache, name)) {
      if (has(this.patch, name)) {
        styleCache[name] = this.patch[name];
      } else if (has(this.state, name)) {
        styleCache[name] = this.state[name];
      } else {
        if (!this.computedStyle) {
          styleCache[name] = this.style[name];
        }
        if (!styleCache[name]) {
          styleCache[name] = this.getComputedStyle()[name];
        }
      }
    }
    return styleCache[name];
  },

  setProperty(properties, priority) {
    Object.keys(properties).forEach(name => {
      if (this.priority(name) <= priority) {
        this.properties[name] = properties[name];
        this.priorities[name] = priority;
      }
    });
  },

  update() {
    Object.keys(this.properties).forEach(this.property.bind(this));
    this.childList.forEach(child => child.update());
  },

  apply() {
    var nextState = this.nextState;
    var state = this.state;
    var patch = this.patch;
    var display = state.display;

    if (nextState.display === false) {
      patch.display = 'none';
      delete nextState.display;
    } else if (nextState.display === true) {
      patch.display = '';
      delete nextState.display;
    }

    patch.transform = `translate(${addUnit('left', this.left() | 0)}, ${addUnit('top', this.top() | 0)}) ${nextState.transform || ''}`;
    patch.width = this.width(true);
    patch.height = this.height(true);
    unset(['top', 'left', 'right', 'bottom', 'width', 'height', 'transform'], nextState);

    assign(patch, nextState);

    if (patch.display !== 'none') {
      Object.keys(patch).forEach(name => {
        if (state[name] !== patch[name]) {
          state[name] = patch[name];
          this.style[name] = addUnit(name, patch[name]);
        }
      });
      this.patch = {};
    } else if (state.display !== 'none') {
      state.display = this.style.display = 'none';
    }

    this.clearState();
    this.childList.forEach(child => child.apply());
  },

  clearState() {
    assign(this, {
      nextState: {},
      styleCache: {},
      attrCache: {},
      propCache: {},
      posCache: {},
      bcrCache: null,
      computedStyle: null
    });
  },

  onFrame() {
    this.update();
    this.apply();
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

  property(name) {
    if (has(this.nextState, name)) {
      return this.nextState[name];
    }
    var value = this.properties[name];
    if (isFunction(value)) {
      try {
        value = value.call(this, this);
      } catch (error) {
        return console.warn(error);
      }
    }
    if (numericValues.indexOf(name) >= 0) {
      value = parseFloat(value) || 0;
    }
    return this.nextState[name] = value;
  },

  priority(name) {
    return this.priorities[name] | 0;
  }
};

function definePosition (top, height, bottom) {
  assign(ShadowElement.prototype, {

    [top]() {
      if (has(this.posCache, top)) {
        return this.posCache[top];
      }
      this.posCache[top] = this.state[top];
      var value = 0;
      var priority = this.priority(top);
      if (has(this.properties, top) && (priority >= this.priority(height) || priority >= this.priority(bottom))) {
        value = this.property(top);
      } else if (has(this.properties, bottom)) {
        value = this[bottom]() - this[height]();
      }
      return this.posCache[top] = value;
    },

    [height](optional) {
      var bcr;
      if (has(this.posCache, height)) {
        if (typeof this.posCache[height] !== 'number') {
          bcr = this.getBCR();
          this.posCache[height] = bcr[bottom] - bcr[top];
        }
        return this.posCache[height];
      }
      this.posCache[height] = this.state[height];
      var priority = this.priority(height);
      if (has(this.properties, height) && (priority >= this.priority(top) || priority >= this.priority(bottom))) {
        this.posCache[height] = this.property(height);
      } else if (has(this.properties, top) && has(this.properties, bottom)) {
        this.posCache[height] = this[bottom]() - this[top]();
      } else if (!optional) {
        bcr = this.getBCR();
        this.posCache[height] = bcr[bottom] - bcr[top];
      }
      return this.posCache[height];
    },

    [bottom]() {
      if (has(this.posCache, bottom)) {
        return this.posCache[bottom];
      }
      this.posCache[bottom] = this.state[top] + this.state[height];
      var value;
      var priority = this.priority(bottom);
      if (has(this.properties, bottom) && (priority > this.priority(top) || priority > this.priority(height))) {
        value = this.property(bottom);
      } else {
        value = this[top]() + this[height]();
      }
      return this.posCache[bottom] = value;
    }
  });
}

definePosition('top', 'height', 'bottom');
definePosition('left', 'width', 'right');

assign(ShadowElement, {
  PRIOR_INLINE: 4,
  PRIOR_SCRIPT: 1
});

export default ShadowElement;
