(function () {
  'use strict';
  var startInput = document.getElementById('start-date');
  var endInput = document.getElementById('end-date');
  var refreshButton = document.getElementById('refresh');
  var notice = document.getElementById('notice');
  var money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

  function iso(date) { return date.toISOString().slice(0, 10); }
  function defaults() {
    var end = new Date(); end.setUTCDate(end.getUTCDate() - 1);
    var start = new Date(end); start.setUTCDate(start.getUTCDate() - 29);
    startInput.value = iso(start); endInput.value = iso(end);
  }
  function value(id, text) { document.getElementById(id).textContent = text; }
  function safe(value) { var node = document.createElement('span'); node.textContent = String(value == null ? '' : value); return node.innerHTML; }
  function euro(value) { return money.format(Number(value || 0)); }
  function decimal(value) { return number.format(Number(value || 0)); }
  function percent(value) { return decimal(Number(value || 0) * 100) + '%'; }

  function sourceStatus(report) {
    var labels = { googleAnalytics: 'Google Analytics', googleAds: 'Google Ads', searchConsole: 'Search Console' };
    document.getElementById('source-status').innerHTML = Object.keys(labels).map(function (key) {
      var source = report.sources[key];
      var state = !source.configured ? ['Не подключён', 'off'] : source.error ? ['Ошибка', 'error'] : ['Работает', ''];
      var detail = source.error ? source.error : !source.configured ? 'Ожидает доступа Google' : 'Данные получены';
      return '<div class="source"><div><strong>' + labels[key] + '</strong><small>' + safe(detail) + '</small></div><span class="badge ' + state[1] + '">' + state[0] + '</span></div>';
    }).join('');
  }

  function table(id, rows, cells, colspan) {
    document.getElementById(id).innerHTML = rows.length ? rows.map(function (row) {
      return '<tr>' + cells.map(function (cell) { return '<td>' + cell(row) + '</td>'; }).join('') + '</tr>';
    }).join('') : '<tr class="muted-row"><td colspan="' + colspan + '">Нет данных за выбранный период</td></tr>';
  }

  function chart(daily) {
    var root = document.getElementById('trend-chart');
    if (!daily.length) { root.innerHTML = '<div class="empty">График появится после подключения Google Ads.</div>'; return; }
    var width = 900, height = 250, pad = 28;
    var maxSpend = Math.max.apply(null, daily.map(function (d) { return d.spend || 0; })) || 1;
    var maxConversions = Math.max.apply(null, daily.map(function (d) { return d.conversions || 0; })) || 1;
    function points(field, max) { return daily.map(function (d, i) {
      var x = pad + i * ((width - pad * 2) / Math.max(1, daily.length - 1));
      var y = height - pad - ((d[field] || 0) / max) * (height - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' '); }
    var labels = daily.filter(function (_, i) { return i === 0 || i === daily.length - 1 || i === Math.floor(daily.length / 2); }).map(function (d, index, list) {
      var sourceIndex = daily.indexOf(d); var x = pad + sourceIndex * ((width - pad * 2) / Math.max(1, daily.length - 1));
      return '<text class="axis-label" x="' + x + '" y="247" text-anchor="' + (index === 0 ? 'start' : index === list.length - 1 ? 'end' : 'middle') + '">' + safe(d.date.slice(5)) + '</text>';
    }).join('');
    root.innerHTML = '<svg viewBox="0 0 900 250" role="img"><line class="gridline" x1="28" y1="28" x2="872" y2="28"/><line class="gridline" x1="28" y1="125" x2="872" y2="125"/><line class="gridline" x1="28" y1="222" x2="872" y2="222"/><polyline class="spend-line" points="' + points('spend', maxSpend) + '"/><polyline class="conversion-line" points="' + points('conversions', maxConversions) + '"/>' + labels + '</svg>';
  }

  function render(report) {
    var ads = report.sources.googleAds.data;
    var ga = report.sources.googleAnalytics.data;
    var search = report.sources.searchConsole.data;
    var conversions = ads && ads.summary.conversions || 0;
    var spend = ads && ads.summary.spend || 0;
    value('kpi-spend', ads ? euro(spend) : '—');
    value('kpi-conversions', ads ? decimal(conversions) : '—');
    value('kpi-cpa', ads && conversions ? euro(spend / conversions) : '—');
    value('kpi-sessions', ga ? decimal(ga.summary.sessions) : '—');
    value('kpi-organic', search ? decimal(search.summary.clicks) : '—');
    value('kpi-roas', ads && spend ? decimal(ads.summary.conversionValue / spend) + '×' : '—');
    sourceStatus(report);
    value('generated-at', 'Отчёт сформирован: ' + new Date(report.generatedAt).toLocaleString('ru-RU'));
    chart(ads ? ads.daily : []);
    table('campaigns', ads ? ads.campaigns : [], [
      function (r) { return '<strong>' + safe(r.name) + '</strong><small>' + safe(r.secondary || '') + '</small>'; },
      function (r) { return euro(r.spend); }, function (r) { return decimal(r.clicks); }, function (r) { return decimal(r.conversions); },
      function (r) { return r.conversions ? euro(r.spend / r.conversions) : '—'; }, function (r) { return euro(r.conversionValue); }
    ], 6);
    table('channels', ga ? ga.channels : [], [function (r) { return safe(r.name); }, function (r) { return decimal(r.sessions); }, function (r) { return decimal(r.keyEvents); }], 3);
    table('queries', search ? search.queries : [], [function (r) { return safe(r.name); }, function (r) { return decimal(r.organicClicks); }, function (r) { return decimal(r.organicImpressions); }, function (r) { return percent(r.ctr); }, function (r) { return decimal(r.position); }], 5);
    var disconnected = Object.keys(report.sources).filter(function (key) { return !report.sources[key].configured; });
    notice.classList.toggle('hidden', disconnected.length === 0);
    if (disconnected.length) notice.textContent = 'Панель готова к подключению. Сейчас необходимо выдать сервисному аккаунту Google доступ к источникам данных.';
  }

  async function load(force) {
    refreshButton.disabled = true;
    try {
      var query = new URLSearchParams({ startDate: startInput.value, endDate: endInput.value });
      if (force) query.set('refresh', 'true');
      var response = await fetch('/api/dashboard?' + query.toString());
      var payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Не удалось загрузить отчёт.');
      render(payload);
    } catch (error) {
      notice.textContent = error.message || 'Не удалось загрузить отчёт.';
      notice.classList.remove('hidden');
    } finally { refreshButton.disabled = false; }
  }
  refreshButton.addEventListener('click', function () { load(true); });
  defaults(); load(false);
})();

