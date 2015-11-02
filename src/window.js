import {on} from './util';
import frame from './frame';
import mouse from './mouse';
import assign from 'object-assign';
import EventEmitter from 'events';

var start = [0, 0];
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
on(window, 'touchstart', event => {
  start = [$window.left, $window.top];
  touchEvent = { pageX: event.touches[0].pageX, pageY: event.touches[0].pageY };
});
on(window, 'touchmove', event => {
  event.preventDefault();
  $window.left = start[0] + event.touches[0].pageX - touchEvent.pageX | 0;
  $window.top = start[1] + event.touches[0].pageY - touchEvent.pageY | 0;
});
on(window, 'touchend', () => speed = [mouse.speedX, mouse.speedY]);
on(window, 'error', event => document.write(event.stack));

var friction = 0.9;

frame(() => {
  if (resize) {
    assign($window, { width: window.innerWidth, height: window.innerHeight });
    resize = false;
  }
  $window.left += speed[0];
  $window.top += speed[1];
  speed = speed.map(v => v * friction);
});
