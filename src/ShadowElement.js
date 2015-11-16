import assign from 'object-assign';
import {Symbol, $, $$, has, addUnit, isFunction, bind, unset, camelize} from './util';

var symShadow = Symbol('shadow');
var numericValues = ['top', 'left', 'right', 'bottom', 'width', 'height'];

function ShadowElement (element, scope) {
  if (!element) {
    return null;
  }
  if (has(element, symShadow)) {
    return element[symShadow];
  }
  var self = this;
  if (!(self instanceof  ShadowElement)) {
    return new ShadowElement(element, scope);
  }
  element[symShadow] = self;

  assign(self, {
    element,
    style: element.style,
    priorities: {},
    properties: {},
    patch: {},
    state: { position: 'absolute', top: 0, left: 0 },
    childList: [].slice.call(element.children).map(child => ShadowElement(child, scope))
  });

  assign(self.style, self.state);

  self.clearState();

  var properties = {};

  var scopeName = Object.keys(scope);
  var scopeValue = scopeName.map(name => scope[name]);

  var attributes = element.attributes;

  for (var i = attributes.length - 1; i >= 0; i--) {

    var attribute = attributes[i];
    var value = attribute.value;
    var name = attribute.nodeName;
    var decorator = name.charAt(0) + name.slice(-1);

    name = camelize(name.slice(1, -1));

    if (decorator === '()') {
      on(element, name, bind(new Function(scopeName.concat('$event'), value), this, scopeValue));
    } else if (decorator === '{}') {
      properties[name] = bind(new Function(scopeName, `return ${value}`), this, scopeValue);
    } else if (decorator === '[]') {
      properties[name] = value;
    }
  }

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

  text() {
    return this.element.innerText;
  },

  find(selector) {
    return ShadowElement($(selector, this.element));
  },

  findAll(selector) {
    return $$(selector, this.element).map(ShadowElement);
  },

  attr(key) {
    var self = this;
    if (!has(self.attrCache, key)) {
      self.attrCache[key] = self.element.getAttribute(key);
    }
    return self.attrCache[key];
  },

  hasAttr(key) {
    return this.element.hasAttribute(key);
  },

  prop(key) {
    var self = this;
    if (!has(self.propCache, key)) {
      self.propCache[key] = self.element[key];
    }
    return self.propCache[key];
  },

  css(name) {
    var self = this;
    var styleCache = self.styleCache;
    if (!has(styleCache, name)) {
      if (has(self.patch, name)) {
        styleCache[name] = self.patch[name];
      } else if (has(self.state, name)) {
        styleCache[name] = self.state[name];
      } else {
        if (!self.computedStyle) {
          styleCache[name] = self.style[name];
        }
        if (!styleCache[name]) {
          styleCache[name] = self.getComputedStyle()[name];
        }
      }
    }
    return styleCache[name];
  },

  setAttr(attrs) {
    var keys = Object.keys(attrs);
    for (var i = keys.length - 1; i >= 0; i--) {
      var key = keys[i];
      if (this.attrCache[key] !== attrs[key]) {
        this.element.setAttribute(key, this.attrCache[key] = attrs[key]);
      }
    }
  },

  setProp(props) {
    var keys = Object.keys(props);
    for (var i = keys.length - 1; i >= 0; i--) {
      var key = keys[i];
      if (this.propCache[key] !== props[key]) {
        this.element[key] = this.propCache[key] = attrs[key];
      }
    }
  },

  setText(text) {
    this.element.innerText = text;
    this.childList = [];
    return this;
  },

  setProperty(properties, priority) {
    var propList = Object.keys(properties);
    for (var i = propList.length - 1; i >= 0; i--) {
      var name = propList[i];
      if (this.priority(name) <= priority) {
        this.properties[name] = properties[name];
        this.priorities[name] = priority;
      }
    }
  },

  update() {
    var propList = Object.keys(this.properties);
    for (var i = propList.length - 1; i >= 0; i--) {
      this.property(propList[i]);
    }
  },

  apply() {
    var self = this;
    var nextState = self.nextState;
    var state = self.state;
    var patch = self.patch;

    if (nextState.display === false) {
      patch.display = 'none';
      delete nextState.display;
    } else if (nextState.display === true) {
      patch.display = '';
      delete nextState.display;
    }

    patch.transform = `translate(${addUnit('left', self.left() | 0)}, ${addUnit('top', self.top() | 0)}) ${nextState.transform || ''}`;
    patch.width = self.width(true);
    patch.height = self.height(true);
    unset(['top', 'left', 'right', 'bottom', 'width', 'height', 'transform'], nextState);

    assign(patch, nextState);
    self.clearState();

    if (patch.display === 'none') {
      if (state.display !== 'none') {
        state.display = self.style.display = 'none';
      }
      return;
    }

    var propList = Object.keys(patch);
    for (var i = propList.length - 1; i >= 0; i--) {
      var name = propList[i];
      if (state[name] !== patch[name]) {
        state[name] = patch[name];
        self.style[name] = addUnit(name, patch[name]);
      }
    }
    self.patch = {};
  },

  clearState() {
    var self = this;
    self.nextState = {};
    self.styleCache = {};
    self.attrCache = {};
    self.propCache = {};
    self.posCache = {};
    self.bcrCache = null;
    self.computedStyle = null;
  },

  onFrame() {
    this.walkThrough(shadow => shadow.update());
    this.walkThrough(shadow => shadow.apply());
  },

  walkThrough(callback) {
    var nodes = [this];
    for (var i = 0; i < nodes.length; i++) {
      nodes = nodes.concat(nodes[i].childList);
      if (callback(nodes[i]) === false) {
        return;
      }
    }
  },

  getBCR() {
    var self = this;
    if (!self.bcrCache) {
      self.bcrCache = self.element.getBoundingClientRect();
    }
    return self.bcrCache;
  },

  getComputedStyle() {
    var self = this;
    if (!self.computedStyle) {
      self.computedStyle = getComputedStyle(self.element);
    }
    return self.computedStyle;
  },

  property(name) {
    var self = this;
    if (has(self.nextState, name)) {
      return self.nextState[name];
    }
    var value = self.properties[name];
    if (isFunction(value)) {
      value = value.call(self, self);
    }
    if (numericValues.indexOf(name) >= 0) {
      value = parseFloat(value) || 0;
    }
    return self.nextState[name] = value;
  },

  priority(name) {
    return self.priorities[name] | 0;
  }
};

function definePosition (top, height, bottom) {
  assign(ShadowElement.prototype, {

    [top]() {
      var self = this;
      var posCache = self.posCache;
      if (has(posCache, top)) {
        return posCache[top];
      }
      posCache[top] = self.state[top];
      var value = 0;
      var priority = self.priority(top);
      if (has(self.properties, top) && (priority >= self.priority(height) || priority >= self.priority(bottom))) {
        value = self.property(top);
      } else if (has(self.properties, bottom)) {
        value = self[bottom]() - self[height]();
      }
      return posCache[top] = value;
    },

    [height](optional) {
      var bcr;
      var self = this;
      var posCache = self.posCache;
      if (has(posCache, height)) {
        if (typeof posCache[height] !== 'number') {
          bcr = self.getBCR();
          posCache[height] = bcr[bottom] - bcr[top];
        }
        return posCache[height];
      }
      posCache[height] = self.state[height];
      var priority = self.priority(height);
      if (has(self.properties, height) && (priority >= self.priority(top) || priority >= self.priority(bottom))) {
        posCache[height] = self.property(height);
      } else if (has(self.properties, top) && has(self.properties, bottom)) {
        posCache[height] = self[bottom]() - self[top]();
      } else if (!optional) {
        bcr = self.getBCR();
        posCache[height] = bcr[bottom] - bcr[top];
      }
      return posCache[height];
    },

    [bottom]() {
      var self = this;
      var posCache = self.posCache;
      if (has(posCache, bottom)) {
        return posCache[bottom];
      }
      posCache[bottom] = self.state[top] + self.state[height];
      var value;
      var priority = self.priority(bottom);
      if (has(self.properties, bottom) && (priority > self.priority(top) || priority > self.priority(height))) {
        value = self.property(bottom);
      } else {
        value = self[top]() + self[height]();
      }
      return posCache[bottom] = value;
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
