import assign from 'object-assign';
import frame from './frame';

var rules = [];

export default function layout(elements, properties) {
  if (!elements instanceof Array) {
    elements = [elements];
  }
  rules.push({ elements, properties });
  elements.forEach(element => assign(element.style, {
    position: 'absolute',
    left: 0, top: 0
  }));
}

function evaluate(value, scope, index) {
  if (typeof value === 'function') {
    value = value(scope, index);
  }
  return value;
}

frame(() =>
  rules.forEach(rule =>
    rule.elements.forEach((element, index) => assign(element.style, {
      transform: `translate(${evaluate(rule.properties.left, element, index)}px, ${evaluate(rule.properties.top, element, index)}px)`,
      width: `${evaluate(rule.properties.width, element, index)}px`,
      height: `${evaluate(rule.properties.height, element, index)}px`
    }))
  )
);
