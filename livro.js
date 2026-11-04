const recipes = JSON.parse(document.getElementById('dados').textContent);
const el = id => document.getElementById(id);
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fmt = new Intl.NumberFormat('pt-PT', {maximumFractionDigits: 2});
const measure = (quantity, unit) => unit === 'q.b.' ? unit : fmt.format(quantity) + ' ' + unit;
// This directory key preserves shopping selections saved by the original index.
const key = 'caderno:' + location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
let saved = {};
try { saved = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
const plan = {};
for (const recipe of recipes) {
  const old = saved[recipe.id];
  plan[recipe.id] = {
    on: old?.on === true,
    n: Number.isInteger(old?.n) && old.n >= 1 && old.n <= 50 ? old.n : recipe.porcoes,
    skip: recipe.ingredientes.filter(([name]) => Array.isArray(old?.skip) && old.skip.includes(name)).map(([name]) => name)
  };
}
function persist() {
  try { localStorage.setItem(key, JSON.stringify(plan)); }
  catch { el('aviso').textContent = 'As escolhas ficam disponíveis apenas nesta sessão.'; }
}
function selectedItems(recipe) {
  const p = plan[recipe.id];
  return recipe.ingredientes.filter(([name]) => !p.skip.includes(name))
    .map(([name, quantity, unit]) => ({name, quantity: quantity * p.n / recipe.porcoes, unit}));
}
const textList = items => items.map(i => i.name + ' — ' + measure(i.quantity, i.unit)).join('\n');
async function copy(items) {
  try {
    await navigator.clipboard.writeText(textList(items));
    el('aviso').textContent = 'Lista copiada.';
  } catch { el('aviso').textContent = 'A cópia foi bloqueada. Seleciona o texto ou guarda a lista na página de compras.'; }
}
function totalItems() {
  const items = new Map();
  for (const r of recipes.filter(r => plan[r.id].on)) {
    for (const item of selectedItems(r)) {
      const id = JSON.stringify([item.name, item.unit]);
      const previous = items.get(id);
      items.set(id, {...item, quantity: (previous?.quantity || 0) + item.quantity});
    }
  }
  return [...items.values()];
}
function showShopping() {
  const selected = recipes.filter(r => plan[r.id].on);
  const items = totalItems();
  el('lista').innerHTML = selected.map(r => `<div class="shopping-recipe"><a href="${r.id}.html">${esc(r.nome)} · ${plan[r.id].n} porções</a><button data-remove="${r.id}" aria-label="Retirar ${esc(r.nome)} da lista">Retirar</button></div>`).join('') +
    (items.length ? '<ul class="shopping-items">' + items.map(i => `<li><span>${esc(i.name)}</span><strong>${esc(measure(i.quantity, i.unit))}</strong></li>`).join('') + '</ul>' : '<p>A tua lista ainda não tem ingredientes.</p>');
  el('copiar').disabled = el('guardar').disabled = !items.length;
  el('lista').querySelectorAll('[data-remove]').forEach(button => {
    button.onclick = () => { plan[button.dataset.remove].on = false; persist(); showShopping(); };
  });
}
function setupShopping() {
  // Keep links saved before recipe pages became the main reading experience.
  function oldBookmark() {
    const r = recipes.find(r => r.id === location.hash.slice(1));
    if (r) location.replace(r.id + '.html');
  }
  oldBookmark();
  window.addEventListener('hashchange', oldBookmark);
  showShopping();
  el('copiar').onclick = () => copy(totalItems());
  el('guardar').onclick = () => {
    const url = URL.createObjectURL(new Blob([textList(totalItems()) + '\n'], {type: 'text/plain;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lista-de-compras.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
function setupRecipe(recipe) {
  const p = plan[recipe.id];
  const progressKey = key + 'passos:' + recipe.id;
  let completed = [];
  try {
    const stored = JSON.parse(localStorage.getItem(progressKey));
    if (Array.isArray(stored)) completed = stored.filter(n => Number.isInteger(n) && n >= 0 && n < recipe.passos.length);
  } catch {}
  function update() {
    el('porcoes').textContent = p.n + (p.n === 1 ? ' porção' : ' porções');
    el('menos').disabled = p.n === 1;
    el('mais').disabled = p.n === 50;
    el('incluir').checked = p.on;
    document.querySelectorAll('[data-qty]').forEach(node => {
      const [, quantity, unit] = recipe.ingredientes[Number(node.dataset.qty)];
      node.textContent = measure(quantity * p.n / recipe.porcoes, unit);
    });
    document.querySelectorAll('[data-ingredient]').forEach(input => {
      input.checked = !p.skip.includes(recipe.ingredientes[Number(input.dataset.ingredient)][0]);
    });
    const url = new URL(recipe.id + '.html', 'https://dmsmartins.github.io/livro-de-receitas/');
    el('bring').href = 'https://api.getbring.com/rest/bringrecipes/deeplink?' + new URLSearchParams({
      url: url.href, source: 'web', baseQuantity: recipe.porcoes, requestedQuantity: p.n
    });
    el('bring-note').textContent = 'Envia a receita completa para ' + p.n + (p.n === 1 ? ' pessoa.' : ' pessoas.') +
      (p.skip.length ? ' Desmarcaste ' + p.skip.length + ' ingrediente(s) aqui. Retira-os também no Bring!.' : ' Retira na app os ingredientes que já tens.');
    el('copiar-receita').disabled = !selectedItems(recipe).length;
  }
  el('menos').onclick = () => { p.n--; update(); persist(); };
  el('mais').onclick = () => { p.n++; update(); persist(); };
  el('incluir').onchange = e => { p.on = e.target.checked; persist(); };
  document.querySelectorAll('[data-ingredient]').forEach(input => {
    input.onchange = () => {
      const name = recipe.ingredientes[Number(input.dataset.ingredient)][0];
      p.skip = input.checked ? p.skip.filter(n => n !== name) : [...p.skip, name];
      update(); persist();
    };
  });
  el('copiar-receita').onclick = () => copy(selectedItems(recipe));
  function showProgress() {
    document.querySelectorAll('[data-step]').forEach(input => {
      input.checked = completed.includes(Number(input.dataset.step));
      input.closest('.step').classList.toggle('completed', input.checked);
    });
    const label = completed.length + ' de ' + recipe.passos.length + ' passos concluídos';
    el('progresso').textContent = el('cook-progress').textContent = label;
    el('proximo').disabled = completed.length === recipe.passos.length;
  }
  function saveProgress() {
    try { localStorage.setItem(progressKey, JSON.stringify(completed)); } catch {}
    showProgress();
  }
  document.querySelectorAll('[data-step]').forEach(input => {
    input.onchange = () => {
      const step = Number(input.dataset.step);
      completed = input.checked ? [...new Set([...completed, step])] : completed.filter(n => n !== step);
      saveProgress();
    };
  });
  el('repor').onclick = () => { completed = []; saveProgress(); };
  function nextStep() {
    const next = [...document.querySelectorAll('[data-step]')].find(input => !input.checked);
    next?.closest('.step').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  let cooking = false;
  let wakeLock = null;
  async function keepAwake() {
    if (!cooking || document.visibilityState !== 'visible' || wakeLock) return;
    if (!('wakeLock' in navigator)) {
      el('ecra').textContent = 'Este navegador não permite manter o ecrã ligado automaticamente.';
      return;
    }
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!cooking) { await lock.release(); return; }
      wakeLock = lock;
      el('ecra').textContent = 'O ecrã mantém-se ligado enquanto esta página estiver visível.';
      lock.addEventListener('release', () => {
        wakeLock = null;
        if (cooking) el('ecra').textContent = 'O ecrã voltou às definições normais do dispositivo.';
      });
    } catch { el('ecra').textContent = 'Não foi possível manter o ecrã ligado. Verifica as definições do dispositivo.'; }
  }
  async function setCooking(value) {
    cooking = value;
    document.body.classList.toggle('cooking', value);
    el('modo').setAttribute('aria-pressed', String(value));
    el('modo').textContent = value ? 'Sair do modo de cozinha' : 'Modo de cozinha';
    el('cook-bar').hidden = !value;
    if (value) {
      el('preparacao').scrollIntoView({behavior: 'smooth'});
      await keepAwake();
    } else {
      await wakeLock?.release();
      wakeLock = null;
      el('ecra').textContent = '';
    }
  }
  el('modo').onclick = () => setCooking(!cooking);
  el('sair').onclick = () => setCooking(false);
  el('proximo').onclick = nextStep;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });
  window.addEventListener('pagehide', () => { wakeLock?.release(); });
  update();
  showProgress();
}
const current = recipes.find(r => r.id === document.body.dataset.recipe);
if (current) setupRecipe(current);
else setupShopping();
