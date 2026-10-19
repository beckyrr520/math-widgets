/*
  Vector Addition widget
  ----------------------
  Shows a + b = sum as arrows on a number line, revealed one step at a time.

  To put one on any page, add this where you want it to appear:

    <div data-widget="vector-addition" data-a="3" data-b="-2"></div>

  Options (all optional):
    data-a="3"            first number (green arrow)
    data-b="-2"           second number (blue arrow)
    data-negatives="no"   "New Example" only uses positive numbers
    data-min="-10"        left end of the number line
    data-max="10"         right end of the number line

  and load this file once near the bottom of the page:

    <script src="../widgets/vector-addition.js"></script>

  No outside libraries are needed. Colors come from the page's CSS variables
  (--vec-a, --vec-b, --vec-sum, --ink, --muted), with fallbacks below.
*/
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // Raised negative sign, the way the lesson writes negative numbers: ⁻2
  function fmt(n) { return n < 0 ? '⁻' + Math.abs(n) : String(n); }
  function fmtHTML(n) { return n < 0 ? '<sup>−</sup>' + Math.abs(n) : String(n); }

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  function mount(root) {
    var min = parseInt(root.dataset.min || '-10', 10);
    var max = parseInt(root.dataset.max || '10', 10);
    var negatives = root.dataset.negatives !== 'no';
    if (!negatives && min < 0) { min = 0; if (!root.dataset.max) max = 12; }
    var a = parseInt(root.dataset.a || '3', 10);
    var b = parseInt(root.dataset.b || '-2', 10);
    var step = 0;
    var uid = 'va' + Math.random().toString(36).slice(2, 8);

    root.classList.add('va');
    root.innerHTML =
      '<div class="va-equation" aria-live="polite"></div>' +
      '<div class="va-stage"></div>' +
      '<div class="va-steps" role="group" aria-label="Steps">' +
        '<button type="button" data-step="0">Reset</button>' +
        '<button type="button" data-step="1">Step 1</button>' +
        '<button type="button" data-step="2">Step 2</button>' +
        '<button type="button" data-step="3">Step 3</button>' +
        '<button type="button" class="va-new">New example</button>' +
      '</div>' +
      '<p class="va-caption"></p>';

    var eqEl = root.querySelector('.va-equation');
    var stage = root.querySelector('.va-stage');
    var caption = root.querySelector('.va-caption');

    var W = 640, H = 200, padX = 24, axisY = 160;
    var svg = el('svg', { role: 'img' }, stage);
    function size() {
      // Draw at the real on-screen width so numbers stay readable on phones.
      W = Math.max(300, Math.round(stage.clientWidth || 640));
      padX = W < 500 ? 16 : 24;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
    }
    var defs = el('defs', {}, svg);
    ['a', 'b', 'sum'].forEach(function (key) {
      var m = el('marker', {
        id: uid + '-' + key, viewBox: '0 0 10 10', refX: '7', refY: '5',
        markerWidth: '4', markerHeight: '4', orient: 'auto-start-reverse'
      }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', 'class': 'va-head va-' + key }, m);
    });
    var axisG = el('g', { 'class': 'va-axis' }, svg);
    var arrowsG = el('g', {}, svg);

    function x(v) { return padX + (v - min) * (W - 2 * padX) / (max - min); }

    function drawAxis() {
      axisG.innerHTML = '';
      el('line', { x1: padX - 10, x2: W - padX + 10, y1: axisY, y2: axisY, 'class': 'va-line' }, axisG);
      var unit = (W - 2 * padX) / (max - min);
      var labelEvery = unit < 22 ? 2 : 1;
      for (var v = min; v <= max; v++) {
        var big = v === 0;
        el('line', { x1: x(v), x2: x(v), y1: axisY - (big ? 9 : 5), y2: axisY + (big ? 9 : 5), 'class': big ? 'va-zero' : 'va-tick' }, axisG);
        if (v % labelEvery === 0 || big) {
          var t = el('text', { x: x(v), y: axisY + 26, 'class': 'va-num' + (big ? ' va-zero-label' : '') }, axisG);
          t.textContent = fmt(v);
        }
      }
    }

    function arrow(from, to, y, key, label, visible) {
      var g = el('g', { 'class': 'va-arrow va-' + key + (visible ? ' is-on' : '') }, arrowsG);
      // Stop the line short so the arrowhead's tip lands exactly on the number.
      var dir = to > from ? 1 : -1;
      el('line', { x1: x(from), x2: x(to) - dir * 6, y1: y, y2: y, 'marker-end': 'url(#' + uid + '-' + key + ')' }, g);
      el('circle', { cx: x(from), cy: y, r: 3.5 }, g);
      var t = el('text', { x: (x(from) + x(to)) / 2, y: y - 10 }, g);
      t.textContent = label;
    }

    function render() {
      var s = a + b;
      arrowsG.innerHTML = '';
      arrow(0, a, 128, 'a', fmt(a), step >= 1);
      arrow(a, s, 96, 'b', fmt(b), step >= 2);
      arrow(0, s, 52, 'sum', fmt(s), step >= 3);
      var dot = el('circle', { cx: x(s), cy: axisY, r: 6, 'class': 'va-land' + (step >= 3 ? ' is-on' : '') }, arrowsG);

      eqEl.innerHTML =
        '<span class="va-a' + (step >= 1 ? ' is-on' : '') + '">' + fmtHTML(a) + '</span> + ' +
        '<span class="va-b' + (step >= 2 ? ' is-on' : '') + '">' + fmtHTML(b) + '</span> = ' +
        '<span class="va-sum' + (step >= 3 ? ' is-on' : '') + '">' + (step >= 3 ? fmtHTML(s) : '?') + '</span>';

      var dir = function (n) { return n > 0 ? 'right' : 'left'; };
      var steps = function (n) { return Math.abs(n) + (Math.abs(n) === 1 ? ' step ' : ' steps ') + dir(n); };
      caption.textContent = [
        'Press Step 1 to start at 0.',
        'Start at 0 and take ' + steps(a) + '.',
        'Put the tail of the blue arrow at the nose of the green one, then take ' + steps(b) + '.',
        'You end up at ' + fmt(s) + '. The red arrow goes straight from 0 to where you landed, so ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(s) + '.'
      ][step];
      svg.setAttribute('aria-label', 'Number line showing ' + fmt(a) + ' plus ' + fmt(b) + (step >= 3 ? ' equals ' + fmt(s) : ''));

      root.querySelectorAll('[data-step]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(+btn.dataset.step === step));
      });
    }

    function newExample() {
      var tries = 0, na, nb;
      do {
        if (negatives) {
          na = randInt(min + 1, max - 1);
          nb = randInt(min + 1, max - 1);
        } else {
          na = randInt(1, Math.floor((max - min) / 2));
          nb = randInt(1, max - na);
        }
        tries++;
      } while ((na === 0 || nb === 0 || a + b === na + nb && a === na ||
                na + nb < min || na + nb > max) && tries < 200);
      a = na; b = nb; step = 0;
      render();
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      if (btn.classList.contains('va-new')) newExample();
      else { step = +btn.dataset.step; render(); }
    });

    size();
    drawAxis();
    render();

    var lastW = W;
    window.addEventListener('resize', function () {
      size();
      if (W !== lastW) { lastW = W; drawAxis(); render(); }
    });
  }

  function init() {
    document.querySelectorAll('[data-widget="vector-addition"]').forEach(mount);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.VectorAddition = { mount: mount };
})();
