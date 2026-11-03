const recipes=JSON.parse(document.querySelector('#dados').textContent);
const el=id=>document.getElementById(id);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fmt=new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2});
const key='caderno:'+location.pathname.replace(/index\.html$/,'');
let saved;
try { saved=JSON.parse(localStorage.getItem(key)); } catch {}
const plan={};
for(const r of recipes){
  const old=saved?.[r.id];
  plan[r.id]={on:old?.on===true,n:Number.isInteger(old?.n)&&old.n>=1&&old.n<=50?old.n:r.porcoes,
    skip:r.ingredientes.filter(([name])=>Array.isArray(old?.skip)&&old.skip.includes(name)).map(([name])=>name)};
}
function persist(){try{localStorage.setItem(key,JSON.stringify(plan));}catch{el('aviso').textContent='O navegador permite usar a lista apenas nesta sessão.';}}
const picker=el('receita');
recipes.forEach(r=>picker.add(new Option(r.nome,r.id)));
function active(){return recipes.find(r=>r.id===picker.value);}
function showRecipe(){
  const r=active(), p=plan[r.id];
  el('ficha').innerHTML=`<p class="tag">${esc(r.categoria)} · ${r.minutos} minutos</p><h2>${esc(r.nome)}</h2><p>${esc(r.descricao)}</p><label class="plan"><input type="checkbox" id="incluir" ${p.on?'checked':''}> Incluir na lista de compras</label><div class="row"><h3>Ingredientes</h3><div><button id="menos" aria-label="Diminuir porções">−</button> <span id="porcoes"></span> <button id="mais" aria-label="Aumentar porções">+</button></div></div><div id="ingredientes">${r.ingredientes.map(([name],i)=>`<label class="ingredient"><input type="checkbox" data-i="${i}" ${p.skip.includes(name)?'':'checked'}><span>${esc(name)}</span><b></b></label>`).join('')}</div><h3>Preparação</h3>${r.passos.map(([name,body,tip],i)=>`<section><small>PASSO ${String(i+1).padStart(2,'0')}</small><h4>${esc(name)}</h4><p>${esc(body)}</p><details><summary>Dica de cozinha</summary><p>${esc(tip)}</p></details></section>`).join('')}<a class="bring" href="${r.id}.html">Abrir receita para o Bring! ↗</a><p class="note">A importação usa a receita completa. Ajusta porções e ingredientes no Bring!.</p>`;
  el('incluir').onchange=e=>{p.on=e.target.checked;update();};
  el('menos').onclick=()=>{p.n--;update();};
  el('mais').onclick=()=>{p.n++;update();};
  el('ingredientes').onchange=e=>{
    const name=r.ingredientes[Number(e.target.dataset.i)][0];
    p.skip=e.target.checked?p.skip.filter(s=>s!==name):[...p.skip,name];update();
  };
  update(false);
}
function totals(){
  const items=new Map();
  for(const r of recipes){
    const p=plan[r.id]; if(!p.on)continue;
    for(const [name,qty,unit] of r.ingredientes){
      if(p.skip.includes(name))continue;
      const id=JSON.stringify([name,unit]), prior=items.get(id);
      items.set(id,{name,unit,qty:(prior?.qty||0)+qty*p.n/r.porcoes});
    }
  }
  return [...items.values()];
}
function update(save=true){
  const r=active(),p=plan[r.id],items=totals();
  el('porcoes').textContent=p.n+(p.n===1?' porção':' porções');
  el('menos').disabled=p.n===1; el('mais').disabled=p.n===50;
  document.querySelectorAll('.ingredient b').forEach((b,i)=>{
    const [,qty,unit]=r.ingredientes[i];b.textContent=fmt.format(qty*p.n/r.porcoes)+' '+unit;
  });
  const selected=recipes.filter(r=>plan[r.id].on);
  el('compras').innerHTML=(selected.length?'<p class="note">'+selected.map(r=>esc(r.nome)+' × '+plan[r.id].n).join('<br>')+'</p>':'')+
    (items.length?'<ul>'+items.map(i=>`<li><strong>${esc(i.name)}</strong><span>${fmt.format(i.qty)} ${esc(i.unit)}</span></li>`).join('')+'</ul><p class="note">Para levar esta seleção exata, copia a lista ou guarda o ficheiro de texto.</p>':'<p>'+(selected.length?'Seleciona pelo menos um ingrediente.':'Inclui uma receita para começar a lista.')+'</p>');
  el('copiar').disabled=el('guardar').disabled=!items.length;
  el('aviso').textContent=''; if(save)persist();
}
const listText=()=>totals().map(i=>i.name+' — '+fmt.format(i.qty)+' '+i.unit).join('\n');
el('copiar').onclick=async()=>{try{await navigator.clipboard.writeText(listText());el('aviso').textContent='Lista copiada.';}catch{el('aviso').textContent='A cópia foi bloqueada. Usa «Guardar .txt».';}};
el('guardar').onclick=()=>{const url=URL.createObjectURL(new Blob([listText()+'\n'],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='lista-de-compras.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function navigate(){picker.value=recipes.find(r=>r.id===location.hash.slice(1))?.id||recipes[0].id;showRecipe();}
picker.onchange=()=>{location.hash=picker.value;};window.addEventListener('hashchange',navigate);navigate();
