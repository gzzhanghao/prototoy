import {virtualize} from './VirtualElement';
import frame from './frame';
import {has} from './util';
import assign from 'object-assign';

var PRIORITY_INLINE = 2;
var watchList = [];
var ignoreProps = ['width', 'height', 'top', 'left', 'right', 'bottom'];
var locateProps = ['width', 'height', 'top', 'left'];

function layout (element, rules, priority) {
  if (element instanceof Array) {
    return element.forEach(element => layout(element, rules, priority));
  }
  setup(element, rules, priority | 0);
}

function parse (element) {
  assign(element.style, { position: 'absolute', left: 0, top: 0 });
  var rules = parseElement(element);
  if (Object.keys(rules).length > 0) {
    setup(element, rules, PRIORITY_INLINE);
  }
  [].slice.call(element.children).forEach(parse);
}

function parseElement (element) {
  var rules = {};
  [].slice.call(element.attributes).forEach(attr => {
    var value = parseAttr(attr.nodeName, attr.value);
    if (null !== value) {
      rules[camelize(attr.nodeName.slice(1, -1))] = value;
    }
  });
  return rules;
}

function parseAttr (name, value) {
  var start = name.charAt(0);
  var end = name.charAt(name.length - 1);
  if ((start !== '(' || end !== ')') && (start !== '[' || end !== ']')) {
    return null;
  }
  if (start === '[') {
    value = new Function('', `return ${value}`);
  }
  return value;
}

function setup (element, rules, priority) {
  var virtual = virtualize(element);
  if (watchList.indexOf(virtual) < 0) {
    watchList.push(virtual);
  }
  var currentRules = virtual.rules;
  var currentPriorities = virtual.priorities;
  priority = priority | 0;
  Object.keys(rules).forEach(name => {
    if ((currentPriorities[name] | 0) <= priority) {
      currentRules[name] = rules[name];
      currentPriorities[name] = priority;
    }
  });
}

function update (virtual) {
  var style = virtual.style;
  var state = virtual.state;
  var rules = virtual.rules;
  var nextState = virtual.nextState;
  Object.keys(state).forEach(name => {
    if (locateProps.indexOf(name) < 0 && !has(rules, name)) {
      style[name] = '';
      delete state[name];
    }
  });
  Object.keys(rules).forEach(name => {
    if (ignoreProps.indexOf(name) < 0 && state[name] !== nextState[name]) {
      style[name] = virtual.css(name);
      state[name] = nextState[name];
    }
  });
  locateProps.forEach(name => {
    style[name] = `${virtual[name](true) | 0}px`;
  });
  Object.keys(nextState).forEach(name => delete nextState[name]);
}

function onFrame () {
  watchList.forEach(virtual => {
    Object.keys(virtual.rules).forEach(name => {
      virtual.value(name);
    });
  });
  watchList.forEach(update);
}

function camelize(token) {
  return token.replace(/\-\w/g, match => match.slice(1).toUpperCase());
}

frame(onFrame);
export { layout, parse };
