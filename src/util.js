export function isFunction(value) {
  return typeof value === 'function';
}

export function isUndefined(value) {
  return typeof value === 'undefined';
}

export function isArray(value) {
  return value instanceof Array;
}

export function isFiniteNum(value) {
  return isFinite(value) && !isNaN(parseFloat(value));
}

export function assign(base) {
  for (let i = 1, ii = arguments.length; i < ii; i++) {
    let source = arguments[i];
    let keys = Object.keys(source);
    for (let j = keys.length - 1; j >= 0; j--) {
      base[keys[j]] = source[keys[j]];
    }
  }
  return base;
}
