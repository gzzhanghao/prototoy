import VElement from './VElement';
import { on } from './util';

var $mouse = { x: 0, y: 0 };
var $window = { width: window.innerWidth, height: window.innerHeight };

var elements = window.elements = [];
var requestAnimationFrame = window.requestAnimationFrame;

for (var i = 20; i >= 0; i--) {
  elements.push({ value: i, key: i });
}

var virtual = new VElement({
  name: 'div',
  attr: { 'class': 'root container' },
  children: [
    () => elements.map(v => ({
      name: 'world',
      prop: {
        key: v.key,
        top: $ => $.prev ? $.prev.bottom() + 20 : $mouse.y,
        left: $ => Math.abs(120 * Math.cos(($.top() + $mouse.x) / 90)),
        width: $ => $window.width - Math.abs(120 * Math.cos(($.top() + $mouse.x) / 90)) - $.left(),
        height: 20,
        show: $ => $.top() < $window.height
      },
      style: { background: 'lightblue' },
      children: v.value
    }))
  ]
});

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

document.body.appendChild(virtual.element);
