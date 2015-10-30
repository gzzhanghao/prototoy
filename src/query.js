export var $ = (selector, context) => (context || document).querySelector(selector);
export var $$ = (selector, context) => [].slice.call((context || document).querySelectorAll(selector));
