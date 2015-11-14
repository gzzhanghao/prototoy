import Layout from './layout';
import mouse from './plugins/mouse';
import {$$, on} from './util';
import frame from './frame';
import $window from './plugins/window';

window.$window = $window;

var root = Layout()
  .style({
    '.test': {
      top: $ => $.prev().bottom() + 40,
      left: $ => 40 + 20 * Math.sin(Math.PI * 4 * $.top() / $window.height),
      right: $ => $window.width - 40 + 20 * Math.cos(Math.PI * 4 * $.top() / $window.height),
      height: () => 40,
      background: $ => getColor($.top() / $window.height)
    }
  })
  .parse(document.body);

frame(() => {
  root.update();
  root.apply();
});

function getColor (phase) {
  phase = phase * 512;
  var color = [
    Math.max(256 - phase, 0, phase - 512) | 0,
    Math.min(phase, 512 - phase) | 0,
    Math.max(0, Math.min(phase - 256, 768 - phase)) | 0
  ];
  return `rgb(${color.join(',')})`;
}
