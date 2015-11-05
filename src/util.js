export var isEmpty = value => value === null || typeof value === 'undefined' || Number.isNaN(value);
export var $ = (selector, context) => (context || document).querySelector(selector);
export var $$ = (selector, context) => [].slice.call((context || document).querySelectorAll(selector));
export var on = (element, event, handler) => element.addEventListener(event, handler);
export var off = (element, event, handler) => element.removeEventListener(event, handler);
export var has = (host, key) => host.hasOwnProperty(key);
export var Symbol = token => `${Date.now()} ${token} ${Math.random()}`;
