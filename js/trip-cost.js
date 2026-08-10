/**
 * Las Vegas trip cost calculator.
 *
 * Principle: the site supplies only what it can verify — resort fee, the tax
 * on it, and self-parking. Room rates change daily, so the visitor supplies
 * that; we never invent one. Hotels with unverified parking are shown as
 * unconfirmed and excluded from the total rather than given a placeholder.
 *
 * Data is injected by scripts/apply-hotel-data.mjs as window.CT_HOTELS.
 */
(function () {
  'use strict';

  var DB = window.CT_HOTELS;
  if (!DB || !DB.hotels || !DB.hotels.length) return;

  var TAX = DB.taxRate;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('tcForm');
  if (!form) return;

  var els = {
    nights: $('nights'), rooms: $('rooms'), hotel: $('hotel'),
    rate: $('rate'), car: $('car'),
    lines: $('tcLines'), total: $('tcTotal'), totalLabel: $('tcTotalLabel'),
    sub: $('tcSub'), forLine: $('tcFor'), callout: $('tcCallout'),
    compare: $('tcCompare'), book: $('tcBook'), share: $('tcShare'),
    checked: $('tcChecked'), tax: $('tcTax')
  };

  var money = function (n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  var money0 = function (n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  };
  var feeWithTax = function (h) { return h.fee * (1 + TAX); };

  /** Mandatory add-ons for the whole trip. parkKnown=false when unverified. */
  function addOns(h, nights, rooms, car) {
    var units = nights * rooms;
    var fee = feeWithTax(h) * units;
    var parkKnown = h.park !== null && h.park !== undefined;
    var park = car && parkKnown ? h.park * units : 0;
    return { fee: fee, park: park, parkKnown: parkKnown, total: fee + park };
  }

  /* ---------------------------------------------------------------- setup */
  els.checked.textContent = DB.lastVerified;
  els.tax.textContent = (TAX * 100).toFixed(2).replace(/\.?0+$/, '') + '%';

  // Group the select by area so location reads as a choice, not a list.
  (function buildSelect() {
    var byArea = {};
    DB.hotels.forEach(function (h) { (byArea[h.area] = byArea[h.area] || []).push(h); });
    Object.keys(byArea).sort().forEach(function (area) {
      var g = document.createElement('optgroup');
      g.label = area;
      byArea[area]
        .sort(function (a, b) { return a.name.localeCompare(b.name); })
        .forEach(function (h) {
          var o = document.createElement('option');
          o.value = h.slug;
          o.textContent = h.name + ' — ' + (h.fee === 0 ? 'no resort fee' : money0(h.fee) + '/night');
          g.appendChild(o);
        });
      g.appendChild(document.createTextNode(''));
      els.hotel.appendChild(g);
    });
  })();

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function readState() {
    return {
      nights: clampInt(els.nights.value, 1, 60, 3),
      rooms: clampInt(els.rooms.value, 1, 20, 1),
      slug: els.hotel.value,
      rate: Math.max(0, parseFloat(els.rate.value) || 0),
      car: els.car.checked
    };
  }

  function findHotel(slug) {
    for (var i = 0; i < DB.hotels.length; i++) {
      if (DB.hotels[i].slug === slug) return DB.hotels[i];
    }
    return DB.hotels[0];
  }

  /* --------------------------------------------------------------- render */
  function line(label, sub, value) {
    return '<div class="tc-line"><span>' + label +
      (sub ? '<small>' + sub + '</small>' : '') +
      '</span><b>' + value + '</b></div>';
  }

  function render() {
    var s = readState();
    var h = findHotel(s.slug);
    var a = addOns(h, s.nights, s.rooms, s.car);
    var units = s.nights * s.rooms;
    var unitLabel = s.nights + (s.nights === 1 ? ' night' : ' nights') +
      ' · ' + s.rooms + (s.rooms === 1 ? ' room' : ' rooms');

    els.forLine.textContent = h.name + ' — ' + unitLabel;

    var html = '';
    if (h.fee === 0) {
      html += line('Resort fee', 'This hotel charges none', '$0.00');
    } else {
      html += line('Resort fee',
        money(h.fee) + ' + tax = ' + money(feeWithTax(h)) + ' × ' + units,
        money(a.fee));
    }

    if (s.car) {
      if (!a.parkKnown) {
        html += line('Self parking', 'Rate not verified — confirm at booking', '—');
      } else if (h.park === 0) {
        html += line('Self parking', 'Free at this hotel', '$0.00');
      } else {
        html += line('Self parking', money(h.park) + ' × ' + units, money(a.park));
      }
    }

    var total = a.total;
    if (s.rate > 0) {
      html += line('Room rate', money(s.rate) + ' × ' + units, money(s.rate * units));
      total = a.total + s.rate * units;
      els.totalLabel.textContent = 'True trip total';
    } else {
      els.totalLabel.textContent = 'Mandatory add-ons';
    }

    els.lines.innerHTML = html;
    els.total.textContent = money(total);

    if (s.rate > 0) {
      var pct = (a.total / (s.rate * units)) * 100;
      els.sub.textContent = money(a.total) + ' of this is fees and parking — ' +
        pct.toFixed(0) + '% on top of the rate you were quoted.';
    } else {
      els.sub.textContent = 'Before the room rate. Add your quoted nightly rate above for the full trip total.';
    }

    if (s.car && !a.parkKnown) {
      els.sub.textContent += ' Parking at this hotel is not verified, so it is not included.';
    }

    // Cheapest alternative, as a concrete saving rather than an abstraction.
    var ranked = rankAll(s);
    var best = ranked[0];
    if (best && best.hotel.slug !== h.slug && best.total < a.total) {
      var save = a.total - best.total;
      els.callout.hidden = false;
      els.callout.innerHTML = 'The same ' + unitLabel.toLowerCase() + ' at <b>' +
        best.hotel.name + '</b> (' + best.hotel.area + ') adds ' +
        (best.total === 0 ? '<b>nothing at all</b>' : 'only <b>' + money(best.total) + '</b>') +
        ' — you would keep <b>' + money(save) + '</b>.';
    } else {
      els.callout.hidden = true;
      if (best && best.hotel.slug === h.slug) {
        els.callout.hidden = false;
        els.callout.innerHTML = 'Nothing we track adds less than this for your trip. <b>' +
          h.name + '</b> is the cheapest of the 56 on mandatory add-ons.';
      }
    }

    els.book.href = '/vegas/hotels/' + h.slug + '.html';
    els.book.textContent = 'See the ' + h.name + ' page →';

    renderCompare(ranked, h, s);
    syncUrl(s);
  }

  function rankAll(s) {
    return DB.hotels.map(function (x) {
      var r = addOns(x, s.nights, s.rooms, s.car);
      return { hotel: x, total: r.total, parkKnown: r.parkKnown };
    }).filter(function (r) {
      // Exclude unverified parking from ranking when a car is involved —
      // otherwise they would look artificially cheap.
      return !(s.car && !r.parkKnown);
    }).sort(function (p, q) { return p.total - q.total; });
  }

  function renderCompare(ranked, current, s) {
    var picked = [];
    for (var i = 0; i < ranked.length && picked.length < 5; i++) picked.push(ranked[i]);

    var inList = picked.some(function (r) { return r.hotel.slug === current.slug; });
    if (!inList) {
      for (var j = 0; j < ranked.length; j++) {
        if (ranked[j].hotel.slug === current.slug) { picked.push(ranked[j]); break; }
      }
    }

    var mine = addOns(current, s.nights, s.rooms, s.car).total;
    els.compare.innerHTML = picked.map(function (r) {
      var isYou = r.hotel.slug === current.slug;
      var diff = r.total - mine;
      var cell = isYou ? '<span style="color:var(--text-muted)">your pick</span>'
        : diff < 0 ? '<span class="save">save ' + money(-diff) + '</span>'
          : diff > 0 ? '+' + money(diff)
            : 'same';
      return '<tr' + (isYou ? ' class="is-you"' : '') + '>' +
        '<td><a href="/vegas/hotels/' + r.hotel.slug + '.html">' + r.hotel.name + '</a></td>' +
        '<td>' + r.hotel.area + '</td>' +
        '<td>' + money(r.total) + '</td>' +
        '<td>' + cell + '</td></tr>';
    }).join('');
  }

  /* ------------------------------------------------------- shareable state */
  function syncUrl(s) {
    var p = new URLSearchParams();
    p.set('hotel', s.slug);
    p.set('nights', s.nights);
    if (s.rooms !== 1) p.set('rooms', s.rooms);
    if (s.rate > 0) p.set('rate', s.rate);
    if (s.car) p.set('car', '1');
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function applyUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get('nights')) els.nights.value = clampInt(p.get('nights'), 1, 60, 3);
    if (p.get('rooms')) els.rooms.value = clampInt(p.get('rooms'), 1, 20, 1);
    if (p.get('rate')) els.rate.value = Math.max(0, parseFloat(p.get('rate')) || 0) || '';
    if (p.get('car') === '1') els.car.checked = true;
    var slug = p.get('hotel');
    if (slug && els.hotel.querySelector('option[value="' + CSS.escape(slug) + '"]')) {
      els.hotel.value = slug;
    }
  }

  /* ----------------------------------------------------------------- wire */
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  els.share.addEventListener('click', function () {
    var label = els.share.textContent;
    var done = function (msg) {
      els.share.textContent = msg;
      setTimeout(function () { els.share.textContent = label; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(location.href).then(
        function () { done('Link copied'); },
        function () { done('Press ⌘C to copy'); }
      );
    } else {
      done('Press ⌘C to copy');
    }
  });

  applyUrl();
  render();
})();
