import {parse, layout} from './layout';
import mouse from './mouse';
import {$$, on} from './util';
import frame from './frame';
import $window from './window';

window.$window = $window;

layout($$('.test'), {
  top: $ => $.prev().bottom() + 20,
  left: () => 20,
  right: () => $window.width - 20,
  height: () => 40
});
