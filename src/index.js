import VElement from './VElement';
import { on } from './util';

var $mouse = { x: 0, y: 0 };
var $window = { width: window.innerWidth, height: window.innerHeight };
var elements = window.elements = [];

for (var i = 20; i >= 0; i--) {
  elements.push({ value: i, key: i });
}

function e(name, props, children) {
  return {
    name, children,
    key: props.k || '',
    attr: props.a || {},
    prop: props.p || {},
    style: props.s || {},
    event: props.e || {}
  };
}

var virtual = new VElement(e('div', { a: { 'class': 'root container' } }, [
    () => elements.map(v => e('world', {
      k: v.key,
      p: {
        top: $ => $.prev ? $.prev.bottom() + 20 : 0,
        left: $ => Math.abs(120 * Math.cos(($.top() + $mouse.y + $mouse.x) / 90)),
        width: $ => $window.width - Math.abs(120 * Math.cos(($.top() + $mouse.y + $mouse.x) / 90)) - $.left(),
        height: 20,
        display: $ => $.top() > -$.height() && $.top() < $window.height
      },
      s: { background: 'lightblue' }
    }, v.value))
  ]
));

function frame() {
  virtual.update();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

on(window, 'resize', () => $window = { width: window.innerWidth, height: window.innerHeight });
on(window, 'mousemove', event => $mouse = { x: event.pageX, y: event.pageY });
on(window, 'touchstart', event => event.preventDefault());
on(window, 'touchmove', event => {
  event.preventDefault();
  $mouse = { x: event.touches[0].pageX, y: event.touches[0].pageY };
});

virtual.appendTo(document.body);
