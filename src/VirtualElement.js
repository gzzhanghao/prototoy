import assign from 'object-assign';
import {isNull} from './util';
import frame from './frame';

var virtElems = [];
var symVirt = Symbol('v-element');

class VirtualElement {

  constructor(element) {
    assign(this, {
      element,
      style: element.style,
      props: {},
      rules: {},
      bcr: null
    });
    this.position('fixed');
  }

  appendTo(parent) {
    parent.appendChild(this.element);
    return this;
  }

  insertBefore(sibling) {
    sibling.parentNode.insertBefore(this.element, sibling);
    return this;
  }

  prev() {
    return virtualize(this.element.previousElementSibling);
  }

  next() {
    return virtualize(this.element.nextElementSibling);
  }

  parent() {
    return virtualize(this.element.parentNode);
  }

  children() {
    return virtualize([].slice.call(this.element.children));
  }

  position(value) {
    if (isNull(value)) {
      return this.style.position;
    }
    this.style.position = value;
    return this;
  }

  getBCR() {
    if (!this.bcr) {
      this.bcr = this.element.getBoundingClientRect();
    }
    return this.bcr;
  }

  top() {
    return this.getBCR().top;
  }

  left() {
    return this.getBCR().left;
  }

  width() {
    var bcr = this.getBCR();
    return bcr.right - bcr.left;
  }

  height() {
    var bcr = this.getBCR();
    return bcr.bottom - bcr.top;
  }

  bottom() {
    return this.getBCR().bottom;
  }

  right() {
    return this.getBCR().right;
  }

  setRule(rules) {
    assign(this.rules, rules);
  }

  update() {
    var self = this;
    // position
    if (!isNull(self.rules.relative)) {
      self.position('relative');
    } else if (!isNull(self.rules.absolute)) {
      self.position('absolute');
    } else if (!isNull(self.rules.fixed)) {
      self.position('fixed');
    } else if (!isNull(self.rules.position)) {
      self.position(evaluate(self.rules.position, self));
    }
    // rect
    var rect = {};
    Object.keys(self.rules).forEach(prop =>
      rect[prop] = evaluate(self.rules[prop], self)
    );
    rect = {
      width: isNull(rect.width) ? rect.right - rect.left : rect.width,
      left: isNull(rect.left) ? rect.right - rect.width : rect.left,
      height: isNull(rect.height) ? rect.bottom - rect.top : rect.height,
      top: isNull(rect.top) ? rect.bottom - rect.height : rect.top
    };
    ['width', 'left', 'height', 'top'].forEach(prop => {
      if (self.props[prop] !== rect[prop]) {
        self.props[prop] = rect[prop];
        self.style[prop] = rect[prop] + 'px';
        self.bcr = null;
      }
    });
  }
}

function evaluate(value, context, index) {
  if (typeof value === 'function') {
    value = value.call(context, context, index);
  }
  return value;
}

function virtualize(element) {
  if (element instanceof Array) {
    return element.map(virtualize);
  }
  if (!element.hasOwnProperty(symVirt)) {
    virtElems.push(element[symVirt] = new VirtualElement(element));
  }
  return element[symVirt];
}

frame(() => virtElems.forEach(element => element.update()));

export default virtualize;
