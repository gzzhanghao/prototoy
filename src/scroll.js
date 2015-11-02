import {on} from './util';
import frame from './frame';
import mouse from './mouse';
import assign from 'object-assign';
import EventEmitter from 'events';

var start = [0, 0];
var speed = [0, 0];
var touchEvent = null;
var scroll = assign(new EventEmitter, { x: 0, y: 0 });

export default scroll;

on(window, 'touchstart', event => {
  start = [scroll.x, scroll.y];
  touchEvent = { pageX: event.touches[0].pageX, pageY: event.touches[0].pageY };
});
on(window, 'touchmove', event => {
  event.preventDefault();
  scroll.x = start[0] + event.touches[0].pageX - touchEvent.pageX | 0;
  scroll.y = start[1] + event.touches[0].pageY - touchEvent.pageY | 0;
});
on(window, 'touchend', () => speed = [mouse.speedX, mouse.speedY]);
on(window, 'error', event => document.write(event.stack));

var friction = 0.9;

frame(() => {
  scroll.x += speed[0];
  scroll.y += speed[1];
  speed = speed.map(v => v * friction);
});
