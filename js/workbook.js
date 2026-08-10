/**
 * Fillable trip-planning workbook (Chapter 25).
 *
 * The printed book's QR code lands here, so the row structure must stay
 * identical to the printed worksheets. This only makes the cells fillable,
 * persists them on the device, and fills in the fee/parking figures we
 * already verify for the 56 hotels.
 *
 * Storage is localStorage only — nothing leaves the browser.
 */
(function () {
  'use strict';

  var KEY = 'ct.vegas.workbook.v1';
  var DB = window.CT_HOTELS || null;

  var fields = Array.prototype.slice.call(document.querySelectorAll('[data-wb]'));
  if (!fields.length) return;

  var status = document.getElementById('wbStatus');
  var money = function (n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ------------------------------------------------------------ hotel lists */
  function hotelBySlug(slug) {
    if (!DB) return null;
    for (var i = 0; i < DB.hotels.length; i++) {
      if (DB.hotels[i].slug === slug) return DB.hotels[i];
    }
    return null;
  }

  if (DB) {
    var sorted = DB.hotels.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    document.querySelectorAll('select[data-wb-hotel]').forEach(function (sel) {
      sel.appendChild(new Option('— choose a hotel —', ''));
      sorted.forEach(function (h) { sel.appendChild(new Option(h.name, h.slug)); });
      sel.appendChild(new Option('Other / not listed', 'other'));
    });
  } else {
    // No data injected: degrade to plain text entry rather than an empty menu.
    document.querySelectorAll('select[data-wb-hotel]').forEach(function (sel) {
      var input = document.createElement('input');
      input.setAttribute('data-wb', sel.getAttribute('data-wb'));
      sel.parentNode.replaceChild(input, sel);
    });
    fields = Array.prototype.slice.call(document.querySelectorAll('[data-wb]'));
  }

  /* ------------------------------------------------------------- persistence */
  function load() {
    var saved;
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
    fields.forEach(function (el) {
      var k = el.getAttribute('data-wb');
      if (Object.prototype.hasOwnProperty.call(saved, k)) el.value = saved[k];
    });
  }

  var saveTimer = null;
  function save() {
    var data = {};
    fields.forEach(function (el) {
      if (el.value !== '') data[el.getAttribute('data-wb')] = el.value;
    });
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      flash('Saved to this device · ' + new Date().toLocaleTimeString());
    } catch (e) {
      flash('Could not save — your browser is blocking local storage.');
    }
  }

  function flash(msg) {
    if (!status) return;
    status.textContent = msg;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      status.textContent = 'Type in any cell — your entries save on this device automatically.';
    }, 2600);
  }

  /* ----------------------------------------------------------- calculations */
  var num = function (v) {
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  function nights() {
    var el = document.querySelector('[data-wb="nights"]');
    var n = parseInt(el && el.value, 10);
    return isNaN(n) || n < 1 ? 1 : Math.min(60, n);
  }

  function recalcHotels() {
    if (!DB) return;
    var n = nights();
    ['A', 'B', 'C'].forEach(function (col) {
      var sel = document.querySelector('[data-wb-hotel="' + col + '"]');
      var feeNote = document.querySelector('[data-wb-fee="' + col + '"]');
      var totalCell = document.querySelector('[data-wb-total="' + col + '"]');
      var parkInput = document.querySelector('[data-wb="park' + col + '"]');
      if (!sel) return;

      var h = hotelBySlug(sel.value);
      if (!h) {
        if (feeNote) feeNote.textContent = '';
        if (totalCell) totalCell.textContent = '—';
        return;
      }

      var feeNight = h.fee * (1 + DB.taxRate);
      var parkKnown = h.park !== null && h.park !== undefined;

      if (feeNote) {
        feeNote.textContent = h.fee === 0
          ? 'No resort fee at this hotel.'
          : 'Resort fee ' + money(h.fee) + ' + tax = ' + money(feeNight) + '/night on top of your rate.';
      }

      // Fill parking only when the traveller has not typed their own answer.
      if (parkInput && !parkInput.value) {
        parkInput.value = !parkKnown ? 'Confirm at booking'
          : h.park === 0 ? 'Free self-parking'
            : money(h.park) + '/night self-parking';
      }

      if (totalCell) {
        var total = feeNight * n + (parkKnown ? h.park * n : 0);
        totalCell.textContent = money(total) + (parkKnown ? '' : ' + parking');
      }
    });
  }

  function recalcBudget() {
    ['planned', 'actual'].forEach(function (which) {
      var sum = 0;
      document.querySelectorAll('[data-wb-sum="' + which + '"]').forEach(function (el) {
        sum += num(el.value);
      });
      var cell = document.querySelector('[data-wb-total-sum="' + which + '"]');
      if (cell) cell.textContent = sum > 0 ? money(sum) : '—';
    });
  }

  function recalcAll() { recalcHotels(); recalcBudget(); }

  /* ------------------------------------------------------------------ export */
  function asText() {
    var out = ['Countryman Travels — Vegas trip workbook', ''];
    document.querySelectorAll('.wb-table').forEach(function (table) {
      var heading = table.closest('.data-table-wrap').previousElementSibling;
      while (heading && heading.tagName !== 'H2') heading = heading.previousElementSibling;
      out.push((heading ? heading.textContent : 'Worksheet').toUpperCase());
      Array.prototype.forEach.call(table.tBodies[0].rows, function (row) {
        var cells = Array.prototype.map.call(row.cells, function (td) {
          var f = td.querySelector('input, select');
          if (f) return f.tagName === 'SELECT' ? (f.selectedOptions[0] || {}).text || '' : f.value;
          return td.textContent.trim();
        });
        var label = cells.shift();
        var vals = cells.filter(function (v) { return v && v !== '—'; });
        if (vals.length) out.push('  ' + label + ': ' + vals.join('  |  '));
      });
      out.push('');
    });
    out.push('Nights: ' + nights());
    return out.join('\n');
  }

  /* -------------------------------------------------------------------- wire */
  document.addEventListener('input', function (e) {
    if (!e.target.matches('[data-wb]')) return;
    recalcAll();
    save();
  });
  document.addEventListener('change', function (e) {
    if (!e.target.matches('[data-wb]')) return;
    recalcAll();
    save();
  });

  var printBtn = document.getElementById('wbPrint');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  var copyBtn = document.getElementById('wbCopy');
  if (copyBtn) {
    var label = copyBtn.textContent;
    var flashBtn = function (msg) {
      copyBtn.textContent = msg;
      setTimeout(function () { copyBtn.textContent = label; }, 2000);
    };

    /** Last resort: show the text so it can be selected and copied by hand. */
    var reveal = function (text) {
      var existing = document.getElementById('wbCopyOut');
      if (existing) existing.remove();
      var wrap = document.createElement('div');
      wrap.id = 'wbCopyOut';
      wrap.style.cssText = 'margin:1rem 0';
      var p = document.createElement('p');
      p.style.cssText = 'margin:0 0 .4rem;font-size:.83rem;color:var(--text-dim)';
      p.textContent = 'Your browser blocked the clipboard. Select the text below and copy it manually.';
      var ta = document.createElement('textarea');
      ta.readOnly = true;
      ta.value = text;
      ta.style.cssText = 'width:100%;min-height:220px;padding:.7rem;border:1px solid var(--line-strong);border-radius:8px;font:inherit;font-size:.82rem';
      wrap.appendChild(p);
      wrap.appendChild(ta);
      copyBtn.closest('.wb-bar').insertAdjacentElement('afterend', wrap);
      ta.focus();
      ta.select();
    };

    copyBtn.addEventListener('click', function () {
      var text = asText();

      // execCommand still works where the async clipboard API is blocked.
      var legacy = function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        document.body.removeChild(ta);
        return ok;
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flashBtn('Copied'); },
          function () { legacy() ? flashBtn('Copied') : reveal(text); }
        );
      } else if (legacy()) {
        flashBtn('Copied');
      } else {
        reveal(text);
      }
    });
  }

  var clearBtn = document.getElementById('wbClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!window.confirm('Clear every entry in this workbook? This cannot be undone.')) return;
      fields.forEach(function (el) {
        if (el.getAttribute('data-wb') === 'nights') { el.value = 3; return; }
        el.value = '';
      });
      try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ }
      recalcAll();
      flash('Workbook cleared.');
    });
  }

  load();
  recalcAll();
})();
