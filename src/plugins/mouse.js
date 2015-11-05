import {on} from './../util';
import frame from './../frame';
import assign from 'object-assign';
import EventEmitter from 'events';

var $mouse = assign(new EventEmitter, {
  pageX: -1, pageY: -1,
  clientX: -1, clientY: -1,
  speedX: 0, speedY: 0
});
var mouseEvent = null;

export default $mouse;

on(window, 'mousedown', onDown);
on(window, 'mousemove', onMove);
on(window, 'mouseup', onUp);
on(window, 'touchstart', touch.bind(null, onDown));
on(window, 'touchmove', touch.bind(null, onMove));
on(window, 'touchend', touch.bind(null, onUp));

function onDown(event) {
  mouseEvent = event;
  $mouse.emit('down', event);
}

function onMove(event) {
  mouseEvent = event;
  $mouse.emit('move', event);
}

function onUp(event) {
  mouseEvent = event;
  $mouse.emit('up', event);
}

var mouseProps = ['pageX', 'pageY', 'clientX', 'clientY'];
function touch(cb, event) {
  if (event.touches.length) {
    mouseProps.forEach(prop => event[prop] = event.touches[0][prop]);
  } else {
    event = null;
  }
  cb(event);
}

var calcSpeed = null;
frame(() => {
  if (!mouseEvent) {
    mouseEvent = $mouse;
  }
  if (calcSpeed) {
    $mouse.speedX = mouseEvent.pageX - calcSpeed[0];
    $mouse.speedY = mouseEvent.pageY - calcSpeed[1];
    calcSpeed = null;
  } else {
    calcSpeed = [$mouse.pageX, $mouse.pageY];
  }
  $mouse.pageX = mouseEvent.pageX;
  $mouse.pageY = mouseEvent.pageY;
  $mouse.clientX = mouseEvent.clientX;
  $mouse.clientY = mouseEvent.clientY;
});

