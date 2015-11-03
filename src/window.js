import {on} from './util';
import frame from './frame';
import $mouse from './mouse';
import assign from 'object-assign';
import EventEmitter from 'events';

var start = null;
var speed = [0, 0];
var resize = false;
var touchEvent = null;
var $window = assign(new EventEmitter, {
  left: 0, top: 0,
  width: window.innerWidth,
  height: window.innerHeight
});

export default $window;

on(window, 'resize', () => resize = true);
$mouse.on('down', event => {
  event.preventDefault();
  start = [$window.left, $window.top];
  touchEvent = { pageX: event.pageX, pageY: event.pageY };
});
$mouse.on('move', event => {
  event.preventDefault();
  if (!start) {
    return;
  }
  $window.left = start[0] + event.pageX - touchEvent.pageX | 0;
  $window.top = start[1] + event.pageY - touchEvent.pageY | 0;
});
$mouse.on('up', () => {
  start = null;
  speed = [$mouse.speedX, $mouse.speedY];
});

var friction = 0.9;

frame(() => {
  if (resize) {
    assign($window, { width: window.innerWidth, height: window.innerHeight });
    resize = false;
  }
  $window.left += speed[0];
  $window.top += speed[1];
  speed = speed.map(v => Math.abs(v * friction) < 1 ? 0 : v * friction);
});

