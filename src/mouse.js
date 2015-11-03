import {on} from './util';
import frame from './frame';
import assign from 'object-assign';
import EventEmitter from 'events';

var mouse = assign(new EventEmitter, {
  pageX: -1, pageY: -1,
  clientX: -1, clientY: -1,
  speedX: 0, speedY: 0
});
var mouseEvent = null;

export default mouse;

on(window, 'mousedown', event => mouseEvent = event);
on(window, 'mousemove', event => mouseEvent = event);
on(window, 'mouseup', event => mouseEvent = event);
on(window, 'touchstart', event => mouseEvent = event.touches[0]);
on(window, 'touchmove', event => mouseEvent = event.touches[0]);
on(window, 'touchend', event => mouseEvent = event.touches[0]);

var calcSpeed = null;

frame(() => {
  if (!mouseEvent) {
    mouseEvent = mouse;
  }
  if (calcSpeed) {
    mouse.speedX = mouseEvent.pageX - calcSpeed[0];
    mouse.speedY = mouseEvent.pageY - calcSpeed[1];
    calcSpeed = null;
  } else {
    calcSpeed = [mouse.pageX, mouse.pageY];
  }
  mouse.pageX = mouseEvent.pageX;
  mouse.pageY = mouseEvent.pageY;
  mouse.clientX = mouseEvent.clientX;
  mouse.clientY = mouseEvent.clientY;
});
