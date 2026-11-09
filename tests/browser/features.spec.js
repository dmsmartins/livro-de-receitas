import {test,expect} from '@playwright/test';
import {lerReceitas} from '../../scripts/validar-receitas.js';
const recipes=lerReceitas();
const risotto=recipes.find(r=>r.slug==='risotto-de-beterraba');
const tomato=recipes.find(r=>r.slug==='tomate-com-manjericao');
const toast=recipes.find(r=>r.slug==='tostas-de-tomate');
const fmt=new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2});
async function ready(page){await expect(page.locator('body')).toHaveAttribute('data-ready','true');}
test('catalogue and all legacy URLs load without browser errors',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('index.html');await expect(page.locator('.card')).toHaveCount(recipes.length);
  for(const r of recipes){
    const slug=r.slug;
    await page.goto(slug+'.html');await ready(page);if(r.porcoes===50)continue;await expect(page.locator('#mais')).toBeEnabled();
    await page.locator('#mais').click();await expect(page.locator('#porcoes')).toContainText(String(r.porcoes+1));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  if(risotto){await page.goto('index.html#'+risotto.id);await expect(page).toHaveURL(/risotto-de-beterraba.html$/);}
  if(tomato){await page.goto('teste-bring.html');await expect(page.locator('h1')).toHaveText(tomato.nome);}
  expect(errors).toEqual([]);
});
test('scaling, selection, Bring parameters, persistence and cooking mode',async({page})=>{
  test.skip(!risotto || risotto.ingredientes.length<10,'Receita de referência indisponível');
  await page.goto('risotto-de-beterraba.html');await ready(page);
  // Wait for JSON loading and event handlers, not only the static HTML.
  await expect(page.locator('#bring-note')).toContainText('Retira na app');
  for(let i=0;i<risotto.porcoes-1;i++)await page.locator('#menos').click();
  await expect(page.locator('#porcoes')).toHaveText('1 porção');
  await expect(page.locator('[data-qty="0"]').first()).toHaveText(fmt.format(risotto.ingredientes[0].quantidade/risotto.porcoes)+' '+risotto.ingredientes[0].unidade);
  await expect(page.locator('[data-qty="4"]').first()).toHaveText(fmt.format(risotto.ingredientes[4].quantidade/risotto.porcoes)+' '+risotto.ingredientes[4].unidade);
  if(risotto.ingredientes[9].unidade==='q.b.')await expect(page.locator('[data-qty="9"]').first()).toHaveText('q.b.');
  await page.locator('[data-ingredient="0"]').uncheck();await page.locator('#incluir').check();
  const link=new URL(await page.locator('#bring').getAttribute('href'));
  expect(link.searchParams.get('baseQuantity')).toBe(String(risotto.porcoes));expect(link.searchParams.get('requestedQuantity')).toBe('1');
  expect(link.searchParams.get('url')).toBe('https://dmsmartins.github.io/livro-de-receitas/risotto-de-beterraba.html');
  await expect(page.locator('#bring-note')).toContainText('Retira-os também');
  await page.locator('[data-step="0"]').check();await page.reload();
  await expect(page.locator('#porcoes')).toHaveText('1 porção');await expect(page.locator('[data-ingredient="0"]')).not.toBeChecked();
  await expect(page.locator('[data-step="0"]')).toBeChecked();
  await page.locator('.step details summary').first().click();await expect(page.locator('.step details').first()).toHaveAttribute('open','');
  await page.locator('#modo').click();await expect(page.locator('body')).toHaveClass('cooking');
  await expect(page.locator('#cook-bar')).toBeVisible();await page.locator('#proximo').click();
  await page.locator('#sair').click();await expect(page.locator('#cook-bar')).toBeHidden();
  await page.locator('#repor').click();await expect(page.locator('#progresso')).toHaveText('0 de '+risotto.passos.length+' passos concluídos');
});
test('shopping consolidates, copies, downloads and removes recipes',async({page})=>{
  test.skip(!tomato || !toast,'Receitas de referência indisponíveis');
  await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}}});});
  for(const slug of ['tomate-com-manjericao','tostas-de-tomate']){
    await page.goto(slug+'.html');await ready(page);
    await page.locator('#incluir').check();
  }
  await page.goto('index.html');await expect(page.locator('.shopping-recipe')).toHaveCount(2);
  const sum=tomato.ingredientes.filter(i=>i.nome==='Tomate').concat(toast.ingredientes.filter(i=>i.nome==='Tomate')).reduce((n,i)=>n+i.quantidade,0);
  await page.locator('#copiar').click();expect(await page.evaluate(()=>window.copied)).toContain('Tomate — '+fmt.format(sum)+' g');
  const download=page.waitForEvent('download');await page.locator('#guardar').click();expect((await download).suggestedFilename()).toBe('lista-de-compras.txt');
  await page.locator('[data-remove="tostas-de-tomate"]').click();await expect(page.locator('.shopping-recipe')).toHaveCount(1);
  await page.reload();await expect(page.locator('.shopping-recipe')).toHaveCount(1);
});
test('data failure is visible and static recipe/JSON-LD remains readable',async({page})=>{
  test.skip(!risotto,'Receita de referência indisponível');
  await page.route('**/receitas/risotto-de-beterraba.json',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.goto('risotto-de-beterraba.html');await expect(page.locator('#aviso')).toContainText('Não foi possível carregar');
  await expect(page.locator('.step')).toHaveCount(risotto.passos.length);
  const ld=JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(ld.recipeIngredient).toHaveLength(risotto.ingredientes.length);expect(ld.recipeYield).toBe(String(risotto.porcoes));
});
test('portion limits, clipboard/storage failures and unsupported wake lock are handled',async({page})=>{
  test.skip(!risotto,'Receita de referência indisponível');
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied');}}});
    Object.defineProperty(window,'localStorage',{get(){throw Error('denied');}});
    delete Navigator.prototype.wakeLock;
  });
  await page.goto('risotto-de-beterraba.html');await ready(page);
  await page.locator('#copiar-receita').click();await expect(page.locator('#aviso')).toContainText('bloqueada');
  for(let i=risotto.porcoes;i>1;i--)await page.locator('#menos').click();
  await expect(page.locator('#menos')).toBeDisabled();
  await page.locator('#incluir').check();await expect(page.locator('#aviso')).toContainText('apenas nesta sessão');
  for(let i=1;i<50;i++)await page.locator('#mais').click();
  await expect(page.locator('#mais')).toBeDisabled();
  await page.locator('#modo').click();await expect(page.locator('#ecra')).toContainText('não permite');
});
