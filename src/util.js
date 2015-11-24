export var $ = (selector, context) => (context || document).querySelector(selector);
export var $$ = (selector, context) => [].slice.call((context || document).querySelectorAll(selector));
export var on = (element, event, handler) => element.addEventListener(event, handler);
export var off = (element, event, handler) => element.removeEventListener(event, handler);
export var isFunction = value => typeof value === 'function';
export var isUndefined = value => typeof value === 'undefined';
export var isArray = value => value instanceof Array;
export var isString = value => typeof value === 'string';
export var isValidNum = value => typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);

export function assign(base) {
  var i, ii, j, source, keys;
  for (i = 1, ii = arguments.length; i < ii; i++) {
    source = arguments[i];
    keys = Object.keys(source);
    for (j = keys.length - 1; j >= 0; j--) {
      base[keys[j]] = source[keys[j]];
    }
  }
  return base;
}
