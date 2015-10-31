import virtualize from './VirtualElement';

var attrNames = ['top', 'left', 'height', 'width', 'bottom', 'right', 'relative', 'absolute', 'fixed', 'position'];
var activateAttr = 'layout';

export function layout(elems, props) {
  if (!(elems instanceof Array)) {
    elems = [elems];
  }
  virtualize(elems).forEach(element => element.setRule(props));
}

export function layoutTree(root) {
  if (root.hasAttribute(activateAttr)) {
    var props = {};
    attrNames.forEach(name => {
      if (root.hasAttribute(name)) {
        props[name] = new Function('', 'return ' + root.getAttribute(name));
      }
    });
    layout(root, props);
  }
  [].slice.call(root.children).forEach(layoutTree);
}
