export var $ = (selector, context) => (context || document).querySelector(selector);
export var $$ = (selector, context) => [].slice.call((context || document).querySelectorAll(selector));
export var on = (element, event, handler) => element.addEventListener(event, handler);
export var off = (element, event, handler) => element.removeEventListener(event, handler);
export var isFunction = value => typeof value === 'function';
export var isUndefined = value => typeof value === 'undefined';
export var isArray = value => value instanceof Array;
