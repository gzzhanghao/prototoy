import layout from './layout';
import mouse from './mouse';
import {$$} from './query';
import on from './on';

var x = 0;
var y = 0;

layout($$('.test'), {
  top: (element, index) => y + index * (30 + y / 2),
  left: () => 0,
  width: () => window.innerWidth,
  height: () => 20 + y / 2
});

var start = [0, 0];
var touchEvent = null;
var console = $$('.console')[0];

on(window, 'touchstart', event => {
  start = [x, y];
  touchEvent = { pageX: event.touches[0].pageX, pageY: event.touches[0].pageY };
  console.innerHTML = `start ${JSON.stringify(touchEvent)}`;
});
on(window, 'touchmove', event => {
  if (!touchEvent) {
    return;
  }
  x = start[0] + event.touches[0].pageX - touchEvent.pageX;
  y = start[1] + event.touches[0].pageY - touchEvent.pageY;
  console.innerHTML = `move ${x} ${y}`;
});
on(window, 'touchend', () => touchEvent = null);
on(window, 'mousedown', event => {
  start = [x, y];
  touchEvent = { pageX: event.pageX, pageY: event.pageY };
});
on(window, 'mousemove', event => {
  if (!touchEvent) {
    return;
  }
  x = start[0] + event.pageX - touchEvent.pageX;
  y = start[1] + event.pageY - touchEvent.pageY;
});
on(window, 'mouseup', () => touchEvent = null);

on(window, 'mousedown', event => event.preventDefault());
on(window, 'touchstart', event => event.preventDefault());
on(window, 'touchmove', event => event.preventDefault());
on(window, 'error', event => document.write(event.message));
