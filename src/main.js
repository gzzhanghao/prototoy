import {parse, layout} from './layout';
import mouse from './plugins/mouse';
import {$$, on} from './util';
import frame from './frame';
import $window from './plugins/window';

window.$window = $window;

parse(document.body);

layout($$('.test'), {
  top: $ => $.prev().bottom() + 40,
  left: $ => 40 + 20 * Math.sin(Math.PI * 2 * $.top() / $window.height),
  right: $ => $window.width - 40 + 20 * Math.cos(Math.PI * 2 * $.top() / $window.height),
  height: () => 40
});

