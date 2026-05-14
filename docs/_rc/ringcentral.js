/**
 * ringcentral.js — mkdocs-material-ringcentral plugin
 *
 * Provides:
 *   - Hero canvas: radial emission animation with minimum-angle spacing
 *   - Ticker pause/resume on click
 *   - Re-runs on MkDocs Material instant navigation
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     HERO CANVAS — radial emission animation
     Lines radiate outward from a center point anchored to the widget
     area of the hero. Each new emission is placed at an angle that is
     at least MIN_ANGLE_RAD away from every currently-visible emission,
     so lines spread evenly around the origin and never clump together.
     ------------------------------------------------------------------ */

  var MIN_ANGLE_RAD = Math.PI / 8;   // 22.5° — minimum gap between any two active emissions
  var SPAWN_INTERVAL_MS = 380;       // time between spawning new emissions
  var MAX_SPAWN_ATTEMPTS = 60;       // give up finding a gap after this many tries

  function getSpacedAngle(active) {
    /* Try random angles until we find one at least MIN_ANGLE_RAD away
       from every active emission. If we exhaust MAX_SPAWN_ATTEMPTS we
       fall back to a random angle so the animation never stalls. */
    var angle;
    for (var t = 0; t < MAX_SPAWN_ATTEMPTS; t++) {
      angle = Math.random() * Math.PI * 2;
      var tooClose = false;
      for (var i = 0; i < active.length; i++) {
        var diff = Math.abs(angle - active[i].angle) % (Math.PI * 2);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < MIN_ANGLE_RAD) { tooClose = true; break; }
      }
      if (!tooClose) return angle;
    }
    return angle; // fallback
  }

  function initHeroCanvas() {
    var hero = document.querySelector('.ac-v5-hero');
    if (!hero || hero.dataset.rcCanvas) return;
    hero.dataset.rcCanvas = '1';

    /* Inject canvas behind all hero content */
    var canvas = document.createElement('canvas');
    canvas.className = 'ac-hero-canvas';
    hero.insertBefore(canvas, hero.firstChild);

    var ctx = canvas.getContext('2d');
    var emissions = [];
    var lastSpawn = 0;
    var rafId;

    function resize() {
      canvas.width  = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resize();

    var ro = new ResizeObserver(resize);
    ro.observe(hero);

    function spawnEmission(now) {
      /* Only the living emissions constrain the new angle */
      var active = emissions.filter(function (e) { return e.opacity > 0; });
      var angle  = getSpacedAngle(active);

      emissions.push({
        angle:     angle,
        length:    0,
        maxLength: 120 + Math.random() * 220,
        speed:     1.2 + Math.random() * 2.0,
        opacity:   0.55 + Math.random() * 0.25,
        width:     0.6  + Math.random() * 1.0,
      });
      lastSpawn = now;
    }

    function draw(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* Emission origin: right-of-centre, vertically centred —
         sits over the widget area which represents the comms hub */
      var cx = canvas.width  * 0.62;
      var cy = canvas.height * 0.50;

      /* Spawn on interval */
      if (now - lastSpawn >= SPAWN_INTERVAL_MS) {
        spawnEmission(now);
      }

      /* Draw and age each emission */
      for (var i = emissions.length - 1; i >= 0; i--) {
        var e = emissions[i];
        e.length += e.speed;

        /* Begin fading once the line is 65% of its max length */
        if (e.length > e.maxLength * 0.65) {
          e.opacity -= 0.012;
        }

        if (e.opacity <= 0) {
          emissions.splice(i, 1);
          continue;
        }

        /* Offset the start point slightly so lines don't all share
           the exact same pixel at the origin */
        var startR = 18;
        var x1 = cx + Math.cos(e.angle) * startR;
        var y1 = cy + Math.sin(e.angle) * startR;
        var x2 = cx + Math.cos(e.angle) * e.length;
        var y2 = cy + Math.sin(e.angle) * e.length;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255,255,255,' + (e.opacity * 0.38) + ')';
        ctx.lineWidth   = e.width;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    /* Tear down when the hero leaves the DOM (instant navigation) */
    var mo = new MutationObserver(function () {
      if (!document.contains(hero)) {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        mo.disconnect();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------
     Ticker: clicking the strip toggles a paused state
     ------------------------------------------------------------------ */
  function initTicker() {
    document.querySelectorAll('.rc-ticker').forEach(function (el) {
      if (el.dataset.rcInit) return;
      el.dataset.rcInit = '1';
      el.addEventListener('click', function () {
        el.classList.toggle('is-paused');
      });
    });
  }

  /* ------------------------------------------------------------------
     Init — runs on first load and after every instant navigation swap
     ------------------------------------------------------------------ */
  function init() {
    initTicker();
    initHeroCanvas();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  document.addEventListener('DOMContentSwitch', init);

})();
