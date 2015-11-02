import {parse, layout} from './layout';
import mouse from './mouse';
import {$$, on} from './util';
import frame from './frame';
import scroll from './scroll';

window.scroll = scroll;

layout($$('.test'), {
  top: $ => $.prev().bottom() + Math.max(scroll.y / 7 + 20, 20),
  left: () => 20,
  right: () => window.innerWidth - 20,
  height: () => 40
});
