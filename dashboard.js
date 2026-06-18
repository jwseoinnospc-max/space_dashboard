const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const money = v => v == null ? '미공개' : `$${fmt.format(Math.abs(v))}M`;
const pct = (now, prev) => prev ? `${((now - prev) / prev * 100).toFixed(1)}%` : 'N/A';
let state, revenueChart, profitChart;

fetch('data/companies.json').then(r => r.json()).then(data => {
  state = data;
  const select = document.querySelector('#companySelect');
  data.companies.forEach(c => select.add(new Option(`${c.name} (${c.ticker})`, c.id)));
  select.addEventListener('change', () => render(select.value));
  render(data.companies[0].id);
});

function render(id){
  const c = state.companies.find(x => x.id === id);
  const m = c.metrics;
  document.querySelector('#periodBadge').textContent = c.period;
  document.querySelector('#summaryCards').innerHTML = [
    card('매출', money(m.revenue), `YoY +${pct(m.revenue, m.revenuePrior)}`, 'up'),
    card('매출총이익', money(m.grossProfit), `YoY +${pct(m.grossProfit, m.grossProfitPrior)}`, 'up'),
    card('영업손실', money(m.operatingLoss), `전년 ${money(m.operatingLossPrior)}`, m.operatingLoss > (m.operatingLossPrior ?? m.operatingLoss) ? 'down':'up'),
    card('수주잔고 / 현금', money(m.backlog), `현금 ${money(m.cash)}`, 'up')
  ].join('');
  document.querySelector('#insights').innerHTML = c.insights.map(x => `<li>${x}</li>`).join('');
  document.querySelector('#segmentRows').innerHTML = c.segments.map(s => `<tr><td>${s.name}</td><td>${money(s.revenue)}</td><td>${(s.revenue/m.revenue*100).toFixed(1)}%</td><td>${money(s.grossProfit)}</td></tr>`).join('');
  document.querySelector('#sourceText').innerHTML = `${c.name} ${c.period} 기준 · 원문/참고 URL: <a href="${c.sourceUrl}" target="_blank" rel="noreferrer">${c.sourceUrl}</a>${c.dataNote ? '<br>' + c.dataNote : ''}`;
  drawRevenue(c); drawProfit(c);
}
function card(label, value, change, cls){return `<article class="metric"><span>${label}</span><strong>${value}</strong><em class="${cls}">${change}</em></article>`}
function drawRevenue(c){
  const ctx = document.querySelector('#revenueChart');
  if(revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, { type:'doughnut', data:{ labels:c.segments.map(s=>s.name), datasets:[{ data:c.segments.map(s=>s.revenue), borderWidth:0 }]}, options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, boxWidth:8, font:{weight:'bold'}}}, tooltip:{ callbacks:{ label:x=>`${x.label}: ${money(x.raw)} (${(x.raw/c.metrics.revenue*100).toFixed(1)}%)`}}}}});
}
function drawProfit(c){
  const ctx = document.querySelector('#profitChart');
  if(profitChart) profitChart.destroy();
  const margin = c.metrics.grossProfit / c.metrics.revenue * 100;
  profitChart = new Chart(ctx, { type:'bar', data:{ labels:['매출', '매출총이익', '순손실'], datasets:[{ label:'USD million', data:[c.metrics.revenue, c.metrics.grossProfit, Math.abs(c.metrics.netLoss)] }]}, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:x=>`${money(x.raw)}${x.dataIndex===1?` · GPM ${margin.toFixed(1)}%`:''}`}}}, scales:{ y:{ beginAtZero:true, grid:{color:'#eef2f7'}}, x:{ grid:{display:false}, ticks:{font:{weight:'bold'}}}}}});
}
