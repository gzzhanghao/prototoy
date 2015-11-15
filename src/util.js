var numReg = /^-?\d*\.?\d+$/;
var defaultUnits = { top: 'px', left: 'px', right: 'px', bottom: 'px', width: 'px', height: 'px' };

export var $ = (selector, context) => (context || document).querySelector(selector);
export var $$ = (selector, context) => [].slice.call((context || document).querySelectorAll(selector));
export var on = (element, event, handler) => element.addEventListener(event, handler);
export var off = (element, event, handler) => element.removeEventListener(event, handler);
export var has = (host, key) => host.hasOwnProperty(key);
export var Symbol = token => `${Date.now()} ${token} ${Math.random()}`;
export var isArray = value => value instanceof Array;
export var isFunction = value => typeof value === 'function';
export var isNumber = value => typeof value === 'number' || (typeof value === 'string' && numReg.test(value));
export var isUndefined = value => typeof value === 'undefined';
export var bind = (fn, self, args) => (function(){}).bind.apply(fn, [self].concat(args));
export var unset = (props, host) => props.forEach(prop => delete host[prop]);
export var camelize = string => string.replace(/\-\w/g, match => match.charAt(1).toUpperCase());
export var addUnit = (name, value) => (has(defaultUnits, name) && isNumber(value)) ? value + defaultUnits[name] : value;
