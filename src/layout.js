import virtualize from './VirtualElement';

var attrNames = ['top', 'left', 'height', 'width', 'bottom', 'right', 'position'];
var activateAttr = 'layout';

export function layout(elements, props) {
  if (!(elements instanceof Array)) {
    elements = [elements];
  }
  virtualize(elements).forEach(element => element.setRule(props, 1));
}

export function parse(element) {
  var props = {};
  attrNames.forEach(name => {
    if (element.hasAttribute(name)) {
      props[name] = new Function('', 'return ' + element.getAttribute(name));
    }
  });
  virtualize(element).setRule(props, 2);
  [].slice.call(element.children).forEach(parse);
}

parse(document.body);
