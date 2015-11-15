import Layout from './layout';
import frame from './frame';
import $window from './plugins/window';

var root = Layout()
  .plugin({ $window })
  .style({
    '.test': {
      top: $ => $.prev().bottom() + 40,
      left: $ => 40 + 20 * Math.sin(Math.PI * 2 * $.top() / $window.height),
      right: $ => $window.width - 40 + 20 * Math.cos(Math.PI * 2 * $.top() / $window.height),
      height: () => 40,
      background: $ => getColor($.top() / $window.height),
      borderRadius: $ => 5 + 5 * Math.sin(4 * Math.PI * $.top() / $window.height) + 'px',
      display: $ => $.top() > -40 && $.top() <= $window.height
    }
  })
  .parse(document.body);

function getColor (phase) {
  phase = phase * 512;
  var color = [
    Math.max(256 - phase, 0, phase - 512) | 0,
    Math.min(phase, 512 - phase) | 0,
    Math.max(0, Math.min(phase - 256, 768 - phase)) | 0
  ];
  return `rgb(${color.join(',')})`;
}

frame(() => root.onFrame());
