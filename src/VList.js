import assign from 'object-assign';
import VElement from './VElement';
import {isFunction} from './util';

function VList () {
	var self = this;

	self.element = document.createComment('vlist end');
	self.elements = [];
}

assign(VList.prototype, {
	construct(children) {
		if (isFunction(children)) {
			children = children();
		}
		var index = 0;
		var elements = this.elements;
		var parent = this.parent.element;
		var keys = elements.map(child => child.key);

		this.elements = children.map(child => {
			let oriIdx = keys.indexOf(child.prop.key, index);
			let virtual;
			if (oriIdx < 0) {
				virtual = new VElement(child);
				if (index < elements.length) {
					parent.insertBefore(virtual.element, elements[index].element);
				} else {
					parent.insertBefore(virtual.element, this.element);
				}
			} else {
				while (index < oriIdx) {
					parent.removeChild(elements[index++].element);
				}
				virtual = elements[index++];
			}
			return virtual;
		});
		for (var i = elements.length - 1; i >= index; i--) {
			parent.removeChild(elements[i].element);
		}
	}
});

export default VList;
