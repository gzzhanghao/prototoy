import virtualize from './VirtualElement';
import {layoutTree} from './layout';

var incubator = document.createElement('div');
function parse(template) {
  incubator.innerHTML = template;
  var element = incubator.children[0];
  layoutTree(element);
  return virtualize(element);
}
