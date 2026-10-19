/*
  Vector Addition widget
  ----------------------
  Shows a + b = sum as arrows on a number line, revealed one step at a time.

  To put one on any page, add this where you want it to appear:

    <div data-widget="vector-addition" data-a="3" data-b="-2"></div>

  Options (all optional):
    data-a="3"            first number (green arrow)
    data-b="-2"           second number (blue arrow)
    data-negatives="no"   "New example" only uses positive numbers
    data-min="-10"        left end of the full number line
    data-max="10"         right end of the full number line

  and load this file once near the bottom of the page:

    <script src="../widgets/vector-addition.js"></script>

  Fitting the screen:
    The drawing is rebuilt to fit whatever width it is given, so it works the
    same on a phone, a tablet or a projector. When there is room, the whole
    number line is shown. On a narrow screen it zooms in to just the part of the
    line the example needs (always including 0), so the arrows stay big enough
    to read. Arrow thickness, arrowheads and text all scale with the space.

  No outside libraries are needed. Colors come from the page's CSS variables
  (--vec-a, --vec-b, --vec-sum, --ink, --muted).
*/
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';

  // Smallest comfortable space between whole numbers on the line, in pixels.
  // Below this, the line zooms in instead of squeezing.
  var MIN_UNIT = 24;
  // Fewest whole-number steps to show when zoomed in.
  var MIN_SPAN = 6;

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  // Raised negative sign, the way the lessons write negative numbers: ⁻2
  function fmt(n) { return n < 0 ? '⁻' + Math.abs(n) : String(n); }
  function fmtHTML(n) { return n < 0 ? '<sup>−</sup>' + Math.abs(n) : String(n); }

  function mount(root) {
    var negatives = root.dataset.negatives !== 'no';
    var lineMin = parseInt(root.dataset.min || (negatives ? '-10' : '0'), 10);
    var lineMax = parseInt(root.dataset.max || (negatives ? '10' : '12'), 10);
    var a = parseInt(root.dataset.a || '3', 10);
    var b = parseInt(root.dataset.b || '-2', 10);
    var step = 0;

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
    var svg = el('svg', { role: 'img', focusable: 'false' }, stage);

    // ---- Geometry, recomputed from the available width ----------------------
    var g = {};

    function layout() {
      var W = Math.floor(stage.clientWidth);
      if (!W) return false;
      var s = a + b;

      // Text sizes first: they decide how much room the ends of the line need.
      var tickFont = clamp(W / 32, 12, 15);
      var arrowFont = clamp(W / 26, 15, 21);
      var padX = Math.ceil(tickFont * 1.3) + 4;   // room for "⁻10" centred on the last tick
      var usable = W - 2 * padX;

      // Which part of the number line to show.
      var lo = lineMin, hi = lineMax;
      if (usable / (hi - lo) < MIN_UNIT) {
        var span = Math.max(MIN_SPAN, Math.floor(usable / MIN_UNIT));
        lo = Math.min(0, a, s) - 1;
        hi = Math.max(0, a, s) + 1;
        // Widen evenly up to the span that fits, staying inside the full line.
        while (hi - lo < span) {
          if ((hi - lo) % 2 === 0 && lo > lineMin) lo--; else if (hi < lineMax) hi++; else if (lo > lineMin) lo--; else break;
        }
        lo = Math.max(lo, lineMin);
        hi = Math.min(hi, lineMax);
      }
      var unit = usable / (hi - lo);

      // Arrow sizes scale with the space between numbers.
      var stroke = clamp(unit * 0.16, 3, 5);
      var headLen = clamp(unit * 0.5, 10, 17);
      var headHalf = headLen * 0.62;                // half the height of an arrowhead
      var labelGap = 6;                             // space between an arrow and its label
      // Each row needs: arrowhead below + label + gap + arrowhead of the row above.
      var rowGap = Math.ceil(2 * headHalf + labelGap + arrowFont + 8);

      // Top row: room for its label (text reaches about 1 font-size above its baseline).
      var ySum = Math.ceil(headHalf + labelGap + arrowFont * 1.05 + 4);
      var yB = ySum + rowGap;
      var yA = yB + rowGap;
      var axisY = yA + Math.round(rowGap * 0.85);
      var H = Math.ceil(axisY + 12 + tickFont * 1.6);

      g = { W: W, H: H, lo: lo, hi: hi, unit: unit, padX: padX, axisY: axisY,
            yA: yA, yB: yB, ySum: ySum, stroke: stroke, headLen: headLen,
            tickFont: tickFont, arrowFont: arrowFont };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      return true;
    }

    function x(v) { return g.padX + (v - g.lo) * g.unit; }

    function drawAxis(parent) {
      var axis = el('g', { 'class': 'va-axis' }, parent);
      var y = g.axisY;
      el('line', { x1: x(g.lo) - 6, x2: x(g.hi) + 6, y1: y, y2: y, 'class': 'va-line' }, axis);
      var every = g.unit < 22 ? 2 : 1;
      for (var v = g.lo; v <= g.hi; v++) {
        var zero = v === 0;
        var t = zero ? 10 : 6;
        el('line', { x1: x(v), x2: x(v), y1: y - t, y2: y + t, 'class': zero ? 'va-zero' : 'va-tick' }, axis);
        if (zero || v % every === 0) {
          var label = el('text', { x: x(v), y: y + 14 + g.tickFont, 'class': 'va-num' + (zero ? ' va-zero-label' : ''),
                                   style: 'font-size:' + g.tickFont + 'px' }, axis);
          label.textContent = fmt(v);
        }
      }
    }

    function arrow(parent, from, to, y, key, label, on) {
      var grp = el('g', { 'class': 'va-arrow va-' + key + (on ? ' is-on' : '') }, parent);
      var x1 = x(from), x2 = x(to);
      var dir = x2 > x1 ? 1 : -1;
      var len = Math.abs(x2 - x1);
      // A short arrow gets a smaller head, so the head never sticks out past the tail.
      var hl = Math.min(g.headLen, len * 0.6);
      var hw = hl * 0.62;
      var base = x2 - dir * hl;
      el('line', { x1: x1, x2: base + dir * 1, y1: y, y2: y, style: 'stroke-width:' + g.stroke + 'px' }, grp);
      el('path', { d: 'M' + x2 + ',' + y + ' L' + base + ',' + (y - hw) + ' L' + base + ',' + (y + hw) + ' Z' }, grp);
      el('circle', { cx: x1, cy: y, r: Math.max(3, g.stroke * 0.8) }, grp);

      // Label sits above the middle of the arrow, kept inside the drawing.
      var half = (label.length * 0.62 * g.arrowFont) / 2 + 2;
      var lx = clamp((x1 + x2) / 2, half, g.W - half);
      var t = el('text', { x: lx, y: y - hw - 6, style: 'font-size:' + g.arrowFont + 'px' }, grp);
      t.textContent = label;
    }

    function draw() {
      if (!layout()) return;
      var s = a + b;
      svg.innerHTML = '';
      drawAxis(svg);
      arrow(svg, 0, a, g.yA, 'a', fmt(a), step >= 1);
      arrow(svg, a, s, g.yB, 'b', fmt(b), step >= 2);
      arrow(svg, 0, s, g.ySum, 'sum', fmt(s), step >= 3);
      el('circle', { cx: x(s), cy: g.axisY, r: Math.max(5, g.stroke * 1.3), 'class': 'va-land' + (step >= 3 ? ' is-on' : '') }, svg);
      svg.setAttribute('aria-label', 'Number line from ' + fmt(g.lo) + ' to ' + fmt(g.hi) + ' showing ' +
        fmt(a) + ' plus ' + fmt(b) + (step >= 3 ? ' equals ' + fmt(s) : ''));
    }

    function render() {
      var s = a + b;
      eqEl.innerHTML =
        '<span class="va-a' + (step >= 1 ? ' is-on' : '') + '">' + fmtHTML(a) + '</span> + ' +
        '<span class="va-b' + (step >= 2 ? ' is-on' : '') + '">' + fmtHTML(b) + '</span> = ' +
        '<span class="va-sum' + (step >= 3 ? ' is-on' : '') + '">' + (step >= 3 ? fmtHTML(s) : '?') + '</span>';

      var steps = function (n) {
        return Math.abs(n) + (Math.abs(n) === 1 ? ' step ' : ' steps ') + (n > 0 ? 'right' : 'left');
      };
      caption.textContent = [
        'Press Step 1 to start at 0.',
        'Start at 0 and take ' + steps(a) + '.',
        'Put the tail of the blue arrow at the nose of the green one, then take ' + steps(b) + '.',
        'You end up at ' + fmt(s) + '. The red arrow goes straight from 0 to where you landed, so ' +
          fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(s) + '.'
      ][step];

      root.querySelectorAll('[data-step]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(+btn.dataset.step === step));
      });
      draw();
    }

    function newExample() {
      var na, nb, tries = 0;
      do {
        if (negatives) { na = randInt(lineMin + 1, lineMax - 1); nb = randInt(lineMin + 1, lineMax - 1); }
        else { na = randInt(1, Math.floor((lineMax - lineMin) / 2)); nb = randInt(1, lineMax - na); }
        tries++;
      } while ((na === 0 || nb === 0 || (na === a && nb === b) ||
                na + nb < lineMin || na + nb > lineMax) && tries < 200);
      set(na, nb);
    }

    function set(na, nb) { a = na; b = nb; step = 0; render(); }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || !root.contains(btn)) return;
      if (btn.classList.contains('va-new')) newExample();
      else { step = +btn.dataset.step; render(); }
    });

    // Redraw whenever the space changes: window resize, phone rotation,
    // fonts finishing loading, or the page layout shifting.
    var lastW = 0;
    function refit() {
      var w = Math.floor(stage.clientWidth);
      if (w && w !== lastW) { lastW = w; draw(); }
    }
    if ('ResizeObserver' in window) new ResizeObserver(refit).observe(stage);
    else window.addEventListener('resize', refit);

    render();
    var api = { set: set, newExample: newExample };
    root.vectorAddition = api;
    return api;
  }

  function init() {
    document.querySelectorAll('[data-widget="vector-addition"]').forEach(function (node) {
      if (!node.vectorAddition) mount(node);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.VectorAddition = { mount: mount };
})();
