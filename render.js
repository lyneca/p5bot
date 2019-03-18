/* eslint-disable prefer-arrow-callback,no-var,newline-after-var,no-undef */

var system = require('system')

var id = system.args[1];

var page = require('webpage').create();
var i = 0;

function pad(s) {
  switch(('' + s).length) {
    case 1:
      return '000' + ('' + s)
      break;
    case 2:
      return '00' + ('' + s)
      break;
    case 3:
      return '0' + ('' + s)
      break;
    case 4:
      return '' + s
      break;
  }
}

page.open('/tmp/' + id + '/index.html', function() {
  setTimeout(function() {
    phantom.exit();
  }, 30000);

  setInterval(function() {
    page.render("/tmp/" + id + "/frames/out" + pad(++i) + ".png");
  }, 2);
});

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};
