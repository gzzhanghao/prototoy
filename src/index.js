import assign from 'object-assign';
import VElement from './VElement';
import * as util from './util';

var $mouse = { x: 0, y: 0 };
window.elements = [{ key: 1, value: 1 },{ key: 2, value: 2 },{ key: 3, value: 3 },{ key: 4, value: 4 },{ key: 5, value: 5 },{ key: 6, value: 6 },{ key: 7, value: 7 },{ key: 8, value: 8 },{ key: 9, value: 9 }];

var virtual = new VElement({
	name: 'hello',
	children: [
		() => elements.map(v => ({
			name: 'world',
			prop: {
				key: v.key,
				top: $ => $.prev ? $.prev.bottom() + 20 : $mouse.y,
				left: $ => 40 + 40 * Math.cos(($.top() + $mouse.x) / 90),
				width: $ => window.innerWidth - 40 + 40 * Math.sin(($.top() + $mouse.x) / 90) - $.left(),
				height: 20
			},
			style: {
				background: 'lightblue'
			},
			children: v.value
		}))
	]
});

function frame () {
	virtual.update();
	requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

util.on(window, 'mousemove', event => $mouse = { x: event.pageX, y: event.pageY });

document.body.appendChild(virtual.element);
