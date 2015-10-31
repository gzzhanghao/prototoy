import {layout} from './layout';
import mouse from './mouse';
import {$$, on} from './util';
import frame from './frame';

var windowWidth = window.innerWidth;

var x = 0;
var y = window.innerHeight - 40;

layout($$('.test'), {
  top: $ => $.prev().bottom() + Math.max(y / 7 + 20, 20) | 0,
  left: () => 20,
  right: () => windowWidth - 20,
  height: () => 40
});

layout($$('.test.first'), {
  top: () => 20 + y | 0
});

var start = [0, 0];
var speed = [0, 0];
var touchEvent = null;

on(window, 'touchstart', event => {
  event.preventDefault();
  start = [x, y];
  touchEvent = { pageX: event.touches[0].pageX, pageY: event.touches[0].pageY };
});
on(window, 'touchmove', event => {
  event.preventDefault();
  x = start[0] + event.touches[0].pageX - touchEvent.pageX | 0;
  y = start[1] + event.touches[0].pageY - touchEvent.pageY | 0;
});
on(window, 'touchend', () => speed = [mouse.speedX, mouse.speedY]);
on(window, 'error', event => document.write(event.stack));

var friction = 0.9;

frame(() => {
  x += speed[0];
  y += speed[1];
  speed = speed.map(v => v * friction);
});
