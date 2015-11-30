export default {

  isFunction(value) {
    return typeof value === 'function';
  },

  isNull(value) {
    return value === null || typeof value === 'undefined';
  },

  isArray(value) {
    return value instanceof Array;
  },

  isFiniteNum(value) {
    return isFinite(value) && !isNaN(parseFloat(value));
  },

  assign(base) {
    for (let i = 1, ii = arguments.length; i < ii; i++) {
      let source = arguments[i];
      let keys = Object.keys(source);
      for (let j = keys.length - 1; j >= 0; j--) {
        base[keys[j]] = source[keys[j]];
      }
    }
    return base;
  }
};
