import assign from 'object-assign';
import VElement from './VElement';
import * as util from './util';

var $mouse = { x: 0, y: 0 };
var $window = { width: window.innerWidth, height: window.innerHeight };

window.elements = [];

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
				show: $ => $.top() < $window.height,
				height: 20
			},
			style: {
				background: 'lightblue'
			},
			children: () => v.value
		}))
	]
});

function frame () {
	virtual.update();
	requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

util.on(window, 'resize', () => $window = { width: window.innerWidth, height: window.innerHeight });
util.on(window, 'mousemove', event => $mouse = { x: event.pageX, y: event.pageY });
util.on(window, 'touchmove', event => $mouse = { x: event.touches[0].pageX, y: event.touches[0].pageY });

document.body.appendChild(virtual.element);
