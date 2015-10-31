import {layout} from './layout';
import mouse from './mouse';
import {$$, on} from './util';

var x = 0;
var y = window.innerHeight - 40;

layout($$('.test'), {
  top: $ => $.prev().bottom() + 20,
  left: () => 20,
  right: () => window.innerWidth - 20,
  height: () => 20 + Math.max(y / 4, 10)
});

layout($$('.test.first'), {
  top: () => 20 + y
});

var start = [0, 0];
var touchEvent = null;

on(window, 'touchstart', event => {
  start = [x, y];
  touchEvent = { pageX: event.touches[0].pageX, pageY: event.touches[0].pageY };
});
on(window, 'touchmove', event => {
  if (!touchEvent) {
    return;
  }
  x = start[0] + event.touches[0].pageX - touchEvent.pageX;
  y = start[1] + event.touches[0].pageY - touchEvent.pageY;
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
