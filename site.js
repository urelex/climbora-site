// Design layer: heading reveals, card spotlights, mockup entrances, and
// pausing decorative loops while they're off-screen. Anything hidden starts
// hidden only via classes this script adds, so without JS the page simply
// shows everything, unanimated.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var watch = [];

  function wrapWord(node, i) {
    var outer = document.createElement('span');
    var inner = document.createElement('span');
    outer.className = 'w';
    inner.style.setProperty('--i', i);
    inner.appendChild(node);
    outer.appendChild(inner);
    return outer;
  }

  if (!reduce) {
    document.querySelectorAll('.hero h1, .page-hero h1, .section-head h2, .service-block-head h2, .cta-band h2').forEach(function (el) {
      var i = 0;
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrapWord(document.createTextNode(part), i++));
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
          el.replaceChild(wrapWord(node.cloneNode(true), i++), node);
        }
      });
      el.classList.add('split');
      watch.push(el);
    });

    document.querySelectorAll('.footer-wordmark').forEach(function (el) {
      var text = el.textContent.trim();
      el.textContent = '';
      text.split('').forEach(function (ch, i) {
        var letter = document.createElement('span');
        letter.textContent = ch;
        letter.style.setProperty('--i', i);
        el.appendChild(letter);
      });
      watch.push(el);
    });
  }

  document.querySelectorAll('.hero-stage, .mini-stage').forEach(function (el) { watch.push(el); });

  var revealIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      revealIo.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  watch.forEach(function (el) { revealIo.observe(el); });

  var loopIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  });
  document.querySelectorAll('.hero, .page-hero, .marquee, .cta-band, .offer-visual, .intro-badge').forEach(function (el) {
    loopIo.observe(el);
  });

  if (finePointer) {
    document.querySelectorAll('.service-card, .why-card').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();



// Custom cursor: a dot that tracks the pointer exactly and a ring that eases
// after it, growing over anything clickable. Only on real mice/trackpads.
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  root.classList.add('has-cursor');

  var x = -100, y = -100, rx = -100, ry = -100, running = false;
  function tick() {
    rx += (x - rx) * (reduce ? 1 : 0.18);
    ry += (y - ry) * (reduce ? 1 : 0.18);
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) requestAnimationFrame(tick);
    else running = false;
  }
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    root.classList.add('cursor-visible');
    if (!running) { running = true; requestAnimationFrame(tick); }
    var t = e.target.closest ? e.target : null;
    ring.classList.toggle('is-hover', !!(t && t.closest('a, button, select, label, .faq-q, [role="button"], .ba-range')));
    ring.classList.toggle('is-text', !!(t && t.closest('input:not([type="range"]), textarea')));
  });
  document.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
  document.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
  document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('cursor-visible'); });
})();

// ---------------------------------------------------------------------------
// Design layer v3. Every feature checks for its own elements, so this one file
// can load on every page.
// ---------------------------------------------------------------------------
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // ---------- Live topographic map ----------
  // A height field (drifting noise plus one slowly wandering peak) traced
  // with marching squares, the same way real contour maps are drawn.
  var R = new Float32Array(65536);
  for (var n = 0; n < 65536; n++) R[n] = Math.random();
  function noise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    var a = R[(ix & 255) | ((iy & 255) << 8)], b = R[((ix + 1) & 255) | ((iy & 255) << 8)];
    var c = R[(ix & 255) | (((iy + 1) & 255) << 8)], d = R[((ix + 1) & 255) | (((iy + 1) & 255) << 8)];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }
  // Which cell edges each marching-squares case connects (0 top, 1 right, 2 bottom, 3 left)
  var SEGS = [[], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2], [3, 2], [0, 2], [0, 1, 3, 2], [1, 2], [3, 1], [0, 1], [3, 0], []];

  function topo(host) {
    var c = document.createElement('canvas');
    c.className = 'topo';
    c.setAttribute('aria-hidden', 'true');
    host.insertBefore(c, host.firstChild);
    host.classList.add('has-topo');
    var g = c.getContext('2d');
    var w = 0, h = 0, dpr = 1, cell = 15, cols = 0, rows = 0, field = null;
    var px = 0, py = 0, sigma = 190, step = 0.055, running = false, last = 0;

    function size() {
      w = host.clientWidth;
      h = host.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      c.width = w * dpr;
      c.height = h * dpr;
      cell = w < 700 ? 20 : 15;
      sigma = w < 700 ? 110 : 190;
      cols = Math.ceil(w / cell) + 2;
      rows = Math.ceil(h / cell) + 2;
      field = new Float32Array(cols * rows);
      px = w * 0.5;
      py = h * 0.3;
    }

    function draw(t) {
      var tx = w * (0.5 + 0.34 * Math.sin(t * 0.13));
      var ty = h * (0.34 + 0.2 * Math.cos(t * 0.17));
      px += (tx - px) * 0.08;
      py += (ty - py) * 0.08;

      var i, j, k = 0, s2 = 2 * sigma * sigma;
      for (j = 0; j < rows; j++) {
        var y = j * cell;
        for (i = 0; i < cols; i++) {
          var x = i * cell, dx = x - px, dy = y - py;
          field[k++] = 0.62 * noise(x * 0.0032 + t * 0.018, y * 0.0032 - t * 0.01)
            + 0.3 * noise(x * 0.0075 - t * 0.03, y * 0.0075 + t * 0.02)
            + 0.9 * Math.exp(-(dx * dx + dy * dy) / s2);
        }
      }

      var thin = [], bold = [];
      for (j = 0; j < rows - 1; j++) {
        for (i = 0; i < cols - 1; i++) {
          var o = j * cols + i;
          var a = field[o], b = field[o + 1], cc = field[o + cols + 1], d = field[o + cols];
          var lo = Math.min(a, b, cc, d), hi = Math.max(a, b, cc, d);
          for (var l = Math.ceil(lo / step); l * step <= hi; l++) {
            var v = l * step;
            var code = (a > v ? 1 : 0) | (b > v ? 2 : 0) | (cc > v ? 4 : 0) | (d > v ? 8 : 0);
            var seg = SEGS[code];
            if (!seg.length) continue;
            var out = l % 5 === 0 ? bold : thin;
            var x0 = i * cell, y0 = j * cell;
            for (var e = 0; e < seg.length; e++) {
              var ed = seg[e];
              if (ed === 0) out.push(x0 + cell * (v - a) / (b - a), y0);
              else if (ed === 1) out.push(x0 + cell, y0 + cell * (v - b) / (cc - b));
              else if (ed === 2) out.push(x0 + cell * (v - d) / (cc - d), y0 + cell);
              else out.push(x0, y0 + cell * (v - a) / (d - a));
            }
          }
        }
      }

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      // Lines glow around the moving peak and fade to a whisper elsewhere
      function stroke(buf, near, far, width) {
        var grad = g.createRadialGradient(px, py, 0, px, py, sigma * 2.6);
        grad.addColorStop(0, 'rgba(255,255,255,' + near + ')');
        grad.addColorStop(1, 'rgba(255,255,255,' + far + ')');
        g.strokeStyle = grad;
        g.lineWidth = width;
        g.beginPath();
        for (var q = 0; q < buf.length; q += 4) {
          g.moveTo(buf[q], buf[q + 1]);
          g.lineTo(buf[q + 2], buf[q + 3]);
        }
        g.stroke();
      }
      stroke(thin, 0.34, 0.07, 1);
      stroke(bold, 0.6, 0.15, 1.2);
    }

    function loop(ts) {
      if (!running) return;
      requestAnimationFrame(loop);
      if (ts - last < 33) return;
      last = ts;
      draw(ts / 1000);
    }

    size();
    if (reduce) {
      draw(40);
      new ResizeObserver(function () { size(); draw(40); }).observe(host);
      return;
    }
    new ResizeObserver(size).observe(host);
    new IntersectionObserver(function (entries) {
      var on = entries[0].isIntersecting;
      if (on && !running) { running = true; requestAnimationFrame(loop); }
      if (!on) running = false;
    }).observe(host);
  }
  document.querySelectorAll('.hero, .page-hero, .intro-alt').forEach(topo);

  // ---------- One scroll loop for everything scroll-linked ----------
  var scrollers = [], ticking = false;
  function runScrollers() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    scrollers.forEach(function (fn) { fn(y, vh); });
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(runScrollers);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Altimeter: the page is the mountain. Tops out at Mount Logan, Canada's highest peak.
  if (document.querySelector('main')) {
    var alt = document.createElement('div');
    alt.className = 'alt';
    alt.setAttribute('aria-hidden', 'true');
    alt.innerHTML = '<span class="alt-label">ALT</span><div class="alt-track"><i class="alt-mark"></i></div><span class="alt-val">0000 M</span>';
    document.body.appendChild(alt);
    var altVal = alt.querySelector('.alt-val'), altLabel = alt.querySelector('.alt-label'), altMark = alt.querySelector('.alt-mark');
    scrollers.push(function (y, vh) {
      var p = clamp(y / Math.max(1, document.documentElement.scrollHeight - vh), 0, 1);
      altVal.textContent = String(Math.round(p * 5959)).padStart(4, '0') + ' M';
      altLabel.textContent = p > 0.995 ? 'SUMMIT' : 'ALT';
      altMark.style.top = ((1 - p) * 100) + '%';
    });
  }

  // Hero stage lies back, then flattens as you scroll toward it
  var stage = document.querySelector('.hero-stage');
  if (stage && !reduce) {
    scrollers.push(function (y) { stage.style.setProperty('--tilt', (14 * (1 - clamp(y / 520, 0, 1))).toFixed(2)); });
  }

  // Stacking panels: each one shrinks back slightly as the next slides over it
  var panels = document.querySelectorAll('.panel');
  if (panels.length && !reduce) {
    scrollers.push(function () {
      panels.forEach(function (panel, i) {
        var next = panels[i + 1];
        if (!next || getComputedStyle(panel).position !== 'sticky') { panel.style.setProperty('--shrink', 0); return; }
        var top = panel.getBoundingClientRect().top, nextTop = next.getBoundingClientRect().top, h = panel.offsetHeight;
        panel.style.setProperty('--shrink', clamp(1 - (nextTop - top) / h, 0, 1).toFixed(3));
      });
    });
  }

  // The climb: the route draws itself as you scroll, and each stop lights up in turn
  var climb = document.querySelector('.climb-body');
  if (climb) {
    var live = climb.querySelector('.route-live'), dot = climb.querySelector('.climber');
    var stations = climb.querySelectorAll('.st'), steps = climb.querySelectorAll('.step');
    var flag = climb.querySelector('.flag'), stepsList = climb.querySelector('.steps');
    var len = live.getTotalLength(), stops = [];
    stations.forEach(function (st) {
      var cx = +st.querySelector('circle').getAttribute('cx'), cy = +st.querySelector('circle').getAttribute('cy');
      var best = 0, bestD = Infinity;
      for (var s = 0; s <= 200; s++) {
        var pt = live.getPointAtLength(len * s / 200), dd = Math.hypot(pt.x - cx, pt.y - cy);
        if (dd < bestD) { bestD = dd; best = s / 200; }
      }
      stops.push(best);
    });
    if (reduce) {
      stations.forEach(function (st) { st.classList.add('on'); });
      flag.classList.add('on');
    } else {
      climb.classList.add('climb-live');
      live.style.strokeDasharray = len;
      scrollers.push(function (y, vh) {
        var r = climb.getBoundingClientRect();
        var p = clamp((vh * 0.74 - r.top) / (r.height * 0.55), 0, 1);
        live.style.strokeDashoffset = len * (1 - p);
        var pt = live.getPointAtLength(len * p);
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
        stepsList.style.setProperty('--p', p.toFixed(3));
        steps.forEach(function (st, i) {
          var on = p >= stops[i] - 0.01;
          st.classList.toggle('on', on);
          stations[i].classList.toggle('on', on);
        });
        flag.classList.toggle('on', p >= stops[stops.length - 1] - 0.01);
      });
    }
  }
  runScrollers();

  // ---------- Small details that run once, when scrolled into view ----------
  function whenSeen(els, fn, threshold) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        fn(entry.target);
      });
    }, { threshold: threshold || 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  if (!reduce) {
    // Mono labels decode themselves
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    whenSeen(document.querySelectorAll('.eyebrow'), function (el) {
      var text = el.textContent, start = performance.now();
      (function frame(now) {
        var shown = Math.floor(clamp((now - start) / 700, 0, 1) * text.length);
        var out = text.slice(0, shown);
        for (var i = shown; i < text.length; i++) {
          out += /[A-Za-z0-9]/.test(text[i]) ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : text[i];
        }
        el.textContent = out;
        if (shown < text.length) requestAnimationFrame(frame);
      })(start);
    }, 0.6);

    // Numbers count up
    whenSeen(document.querySelectorAll('.fact-num[data-count]'), function (el) {
      var target = +el.dataset.count, node = el.firstChild, start = performance.now();
      (function frame(now) {
        var p = clamp((now - start) / 1100, 0, 1);
        node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(frame);
      })(start);
    });

    // Main buttons lean toward the cursor
    if (finePointer) {
      document.querySelectorAll('.hero .btn, .cta-band .btn, .panel .btn').forEach(function (btn) {
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          btn.style.translate = ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1) + 'px';
        });
        btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
      });
    }
  }

  // FAQ accordions on pages without the home page's inline script
  document.querySelectorAll('.faq-list[data-local] .faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.setAttribute('aria-expanded', btn.parentElement.classList.toggle('open'));
    });
  });

  // ---------- Demo: before / after slider ----------
  document.querySelectorAll('.ba').forEach(function (ba) {
    var range = ba.querySelector('.ba-range'), touched = false;
    function set(v) { ba.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { touched = true; set(range.value); });
    if (reduce) return;
    whenSeen([ba], function () {
      // One slow sweep, so people notice it moves
      var start = performance.now();
      (function frame(now) {
        if (touched) return;
        var p = clamp((now - start) / 2600, 0, 1);
        var v = 50 + Math.sin(p * Math.PI * 2) * 26 * (1 - p * 0.3);
        set(v.toFixed(1));
        range.value = v;
        if (p < 1) requestAnimationFrame(frame);
      })(start);
    }, 0.5);
  });

  // ---------- Demo: content calendar ----------
  document.querySelectorAll('.cal').forEach(function (cal) {
    whenSeen([cal], function () {
      cal.classList.add('in-view');
      setTimeout(function () { cal.classList.add('settled'); }, 1600);
    }, 0.25);
    var buttons = cal.querySelectorAll('.cal-filters button');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn); });
        cal.querySelectorAll('.cal-tile').forEach(function (tile) {
          tile.classList.toggle('dim', btn.dataset.f !== 'all' && tile.dataset.t !== btn.dataset.f);
        });
      });
    });
  });

  // ---------- Demo: working mini store ----------
  document.querySelectorAll('.shop').forEach(function (shop) {
    var cart = {}, body = shop.querySelector('.cart-body'), totalEl = shop.querySelector('.cart-total b');
    var go = shop.querySelector('.cart-go'), stepEls = shop.querySelectorAll('.shop-steps li'), busy = false, done = false;
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    function step(n) { stepEls.forEach(function (li, i) { li.classList.toggle('on', i <= n); }); }
    function render() {
      var names = Object.keys(cart), total = 0;
      body.textContent = '';
      if (!names.length) {
        var empty = document.createElement('div');
        empty.className = 'cart-empty';
        empty.textContent = 'Your cart is empty. Add something.';
        body.appendChild(empty);
      }
      names.forEach(function (name) {
        var item = cart[name];
        total += item.qty * item.price;
        var line = document.createElement('div');
        line.className = 'cart-line';
        var label = document.createElement('span');
        label.textContent = item.qty + ' × ' + name;
        var price = document.createElement('b');
        price.textContent = '$' + item.qty * item.price;
        var remove = document.createElement('button');
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', 'Remove ' + name);
        remove.addEventListener('click', function () { delete cart[name]; render(); });
        line.appendChild(label);
        line.appendChild(price);
        line.appendChild(remove);
        body.appendChild(line);
      });
      totalEl.textContent = '$' + total;
      go.disabled = !names.length;
      go.textContent = 'Check Out';
    }
    function reset() { cart = {}; done = false; step(0); render(); }

    shop.querySelectorAll('.shop-add').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy) return;
        if (done) reset();
        var name = btn.dataset.name;
        if (!cart[name]) cart[name] = { qty: 0, price: +btn.dataset.price };
        cart[name].qty++;
        render();
      });
    });
    go.addEventListener('click', function () {
      if (busy) return;
      if (done) { reset(); return; }
      busy = true;
      go.disabled = true;
      go.textContent = 'Processing…';
      var wait = reduce ? 0 : 650;
      setTimeout(function () { step(1); }, wait);
      setTimeout(function () { step(2); }, wait * 2);
      setTimeout(function () {
        step(3);
        busy = false;
        done = true;
        body.innerHTML = '<div class="cart-done"><i>' + CHECK + '</i><strong>Order Confirmed</strong><span>Demo only. Nothing was charged.</span></div>';
        go.disabled = false;
        go.textContent = 'Start Over';
      }, wait * 3);
    });
    render();
  });
})();

// ---------- Pricing tabs ----------
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.price-tab'));
  if (!tabs.length) return;
  function show(tab, moveFocus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('is-active', on);
    });
    if (moveFocus) tab.focus();
  }
  function fromHash() {
    var match = tabs.filter(function (t) { return t.getAttribute('href') === window.location.hash; })[0];
    if (match) { show(match); return true; }
    return false;
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      show(tab);
      history.replaceState(null, '', tab.getAttribute('href'));
    });
    tab.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      var next = tabs[(i + step + tabs.length) % tabs.length];
      show(next, true);
      history.replaceState(null, '', next.getAttribute('href'));
    });
  });
  show(tabs[0]);
  // Links like /pricing#stores open that tab with the packages in view
  if (fromHash()) document.querySelector('.price-sec').scrollIntoView();
  window.addEventListener('hashchange', fromHash);
})();
