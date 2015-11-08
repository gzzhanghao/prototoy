import assign from 'object-assign';
import frame from './frame';
import {camelize, isArray} from './util';
import VirtualElement from './VirtualElement';

var PRIOR_INLINE = 4;

var transforms = [];
var watchList = [];

function layout (element, properties, priority) {
  if (isArray(element)) {
    return element.forEach(element => layout(element, properties, priority));
  }
  virtualize(element).setProperty(properties, priority | 0);
}

function parse (element) {
  assign(element.style, { position: 'absolute', top: 0, left: 0 });
  var properties = {};
  [].slice.call(element.attributes).forEach(attr => {
    let name = attr.nodeName;
    let start = name.charAt(0);
    let end = name.charAt(name.length - 1);
    if ((start !== '(' || end !== ')') && (start !== '[' || end !== ']')) {
      return;
    }
    let value = attr.value;
    if (start === '[') {
      value = new Function('', `return ${transform(value)}`);
    }
    properties[camelize(name.slice(1, -1))] = value;
  });
  if (Object.keys(properties).length) {
    virtualize(element).setProperty(properties, PRIOR_INLINE);
  }
  [].slice.call(element.children).forEach(parse);
}

function transform (expression) {
  transforms.forEach(transform => expression = transform(expression));
  return expression;
}

function virtualize (element) {
  element = VirtualElement(element);
  if (watchList.indexOf(element) < 0) {
    watchList.push(element);
  }
  return element;
}

frame(() => {
  watchList.forEach(shadow => shadow.update());
  watchList.forEach(shadow => shadow.digest());
});

export { layout, parse, transforms };
