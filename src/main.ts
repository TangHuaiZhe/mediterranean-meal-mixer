import { ingredients, groups, presets, defaultTargets, baseOil, type Nutrients } from './data';
import { selected, withBase, validate, nutrition, mealType, makeRecipe } from './engine';

type State={ids:string[];servings:number;targets:Nutrients;favorites:string[][];activeTab:'recipe'|'shopping'};
const storageKey='mediterranean-mixer-v1';
function readSaved():Partial<State>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
const saved=readSaved();
const state:State={ids:presets[0].ids,servings:1,targets:{...defaultTargets,...saved.targets},favorites:Array.isArray(saved.favorites)?saved.favorites.filter((f):f is string[]=>Array.isArray(f)).map(f=>f.filter(id=>id!=='olive')):[],activeTab:'recipe'};
const $=(selector:string)=>document.querySelector(selector) as HTMLElement;
const fmt=(n:number,d=0)=>n.toFixed(d).replace(/\.0$/,'');
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({targets:state.targets,favorites:state.favorites}))}catch{$('#save-status').textContent='此浏览器未开放本地存储；本次会话仍可使用。'}}
function icon(){return `<svg class="plate-art" viewBox="0 0 460 300" role="img" aria-label="蔬菜、谷物与蛋白质餐盘示意插图"><defs><radialGradient id="plate"><stop stop-color="#fff"/><stop offset="1" stop-color="#e6e3dc"/></radialGradient><filter id="shadow"><feGaussianBlur stdDeviation="8"/></filter></defs><ellipse cx="232" cy="262" rx="188" ry="20" fill="#b2b9a6" opacity=".3" filter="url(#shadow)"/><ellipse cx="230" cy="148" rx="190" ry="134" fill="#d8d7ce"/><ellipse cx="230" cy="142" rx="177" ry="124" fill="url(#plate)"/><ellipse cx="230" cy="142" rx="155" ry="104" fill="#f9f8f3"/><path d="M90 135C125 76 176 53 222 70c-37 40-28 83-4 123-57 26-105 9-128-58Z" fill="#c6a377"/><path d="M123 93c32-28 63-34 90-20-22 25-30 45-26 66-26 3-47-7-64-46Z" fill="#f0dba6"/><path d="M250 58c65-9 113 24 122 79-28 18-52 16-77 0-25-17-41-42-45-79Z" fill="#e57759"/><path d="M268 67c32-6 65 7 83 31-30 0-53-8-83-31Z" fill="#f3ad8a"/><g fill="#637d4e"><circle cx="131" cy="186" r="30"/><circle cx="165" cy="200" r="22"/><circle cx="99" cy="174" r="18"/><circle cx="309" cy="208" r="24"/><circle cx="339" cy="185" r="21"/></g><g fill="#b7bd6c"><circle cx="122" cy="180" r="12"/><circle cx="151" cy="196" r="10"/><circle cx="320" cy="203" r="10"/></g><g fill="#d85b46"><circle cx="230" cy="218" r="15"/><circle cx="257" cy="207" r="13"/><circle cx="290" cy="225" r="14"/></g><g fill="#f3e9bd"><circle cx="204" cy="219" r="7"/><circle cx="186" cy="205" r="7"/><circle cx="211" cy="190" r="7"/></g><path d="M207 40c12 14 26 19 42 18M89 224c20 19 42 26 68 27" stroke="#f6f3e6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`}
function render(){
 const items=selected(state.ids),allItems=withBase(items),err=validate(state.ids),n=nutrition(allItems),meal=!err?mealType(n,allItems):null,recipe=!err?makeRecipe(items,state.servings):null;
 $('#groups').innerHTML=groups.map(g=>`<section class="group"><div class="group-title"><h3>${g.label}</h3><span>${g.hint}</span></div><div class="chips">${ingredients.filter(i=>i.group===g.id).map(i=>`<button class="chip ${state.ids.includes(i.id)?'active':''}" type="button" data-id="${i.id}" aria-pressed="${state.ids.includes(i.id)}">${i.name}</button>`).join('')}</div></section>`).join('');
 $('#presets').innerHTML=presets.map((p,i)=>`<button type="button" class="preset" data-preset="${i}"><strong>${p.name}</strong><small>${p.description}</small></button>`).join('');
 $('#selection').innerHTML=(items.length?items.map(i=>`<span class="selected-chip">${i.name}</span>`).join(''):'<span class="muted">从左侧选择食材</span>')+`<span class="selected-chip base-chip">橄榄油 · 每人 ${baseOil.grams} g（基础用油）</span>`;
 $('#selection-count').textContent=`${items.length} / 8 种（另含橄榄油）`;
 $('#status').textContent=err||'组合合理，可以生成菜谱。';$('#status').className=err?'status error':'status good';
 ($('#generate') as HTMLButtonElement).disabled=!!err;
 $('#servings-value').textContent=String(state.servings);
 renderResult(allItems,n,meal,recipe,err);
 renderFavorites();
}
function renderResult(items:ReturnType<typeof selected>,n:Nutrients,meal:ReturnType<typeof mealType>|null,recipe:ReturnType<typeof makeRecipe>|null,err:string|null){
 if(err||!recipe||!meal){$('#result').innerHTML=`<div class="empty"><span class="empty-mark">✳</span><h2>餐盘还差一步</h2><p>${esc(err||'请选择食材')}</p></div>`;return}
 const p=items.find(i=>i.group==='protein')!,v=items.filter(i=>i.group==='veg').map(i=>i.name).join('与');
 const title=`${items.find(i=>i.group==='flavor')!.name}·${p.name}${v?'配'+v:''}`;
 const fields:[keyof Nutrients,string,string,number][]=[['kcal','热量','千卡',0],['protein','蛋白质','克',1],['fat','脂肪','克',1],['carbs','碳水','克',1],['fiber','膳食纤维','克',1],['sodium','钠','毫克',0]];
 const nutritionHtml=fields.map(([k,label,unit,dec])=>{const pct=Math.round(n[k]/state.targets[k]*100);return `<div class="nutrient"><div><strong>${label}</strong><span>${fmt(n[k],dec)} ${unit} · 每日 ${pct}%</span></div><div class="bar"><i style="width:${Math.min(100,pct)}%"></i></div></div>`}).join('');
 const list=items.map(i=>`<li><span>${i.name}${i.note?` <small>（${i.note}）</small>`:''}</span><strong>${i.grams*state.servings} g</strong></li>`).join('');
 const shopping=items.map(i=>`<label class="shop-item"><input type="checkbox"><span>${i.name} · ${i.grams*state.servings} g${i.note?`，${i.note}`:''}</span></label>`).join('');
 $('#result').innerHTML=`<div class="result-top"><div><div class="eyebrow">为你生成的一餐 / ${state.servings} 人份</div><h2>${title}</h2><p>${meal.label} · ${recipe.time}</p></div><div class="art-wrap">${icon()}<span>餐盘示意插图</span></div></div>
 <div class="result-actions"><button type="button" id="favorite-btn">☆ 收藏组合</button><button type="button" id="print-btn">↗ 打印菜谱</button></div>
 <div class="result-grid"><div class="recipe-pane"><div class="section-heading"><h3>食材清单</h3><span>以下为 ${state.servings} 人份</span></div><ul class="ingredient-list">${list}</ul><div class="section-heading"><h3>开始烹调</h3><span>按顺序操作</span></div><ol class="steps">${recipe.steps.map(s=>`<li>${s}</li>`).join('')}</ol><div class="method-box"><h4>换用其他设备</h4><p><strong>蒸箱：</strong>${recipe.steam}出锅后拌入本餐橄榄油。</p><p><strong>空气炸锅：</strong>${recipe.airFryer}</p><p><strong>微波炉：</strong>${recipe.microwave}</p></div><div class="safety"><strong>食安提示</strong><p>${recipe.safety}</p></div></div>
 <aside class="nutrition-pane"><div class="section-heading"><h3>每份营养估算</h3><span>约值</span></div>${nutritionHtml}<p class="nutrition-note">按食材标示重量与每 100 g 近似数据线性计算；未计烹调损耗、额外盐油、品牌差异。不是个体医疗或营养建议。</p><div class="meal-note"><strong>适合 ${meal.label}</strong><p>${meal.reason}</p></div></aside></div>
 <section class="shopping-section"><div class="section-heading"><h3>购物清单</h3><span>勾选仅在当前页面有效</span></div><div class="shop-list">${shopping}</div><button type="button" id="copy-list">复制购物清单</button></section>`;
 $('#favorite-btn')!.addEventListener('click',()=>{if(!state.favorites.some(f=>f.join('|')===state.ids.join('|'))){state.favorites.unshift([...state.ids]);state.favorites=state.favorites.slice(0,12);persist();renderFavorites()}$('#save-status').textContent='已收藏当前组合。'});
 $('#print-btn')!.addEventListener('click',()=>window.print());
 $('#copy-list')!.addEventListener('click',async()=>{const value=items.map(i=>`${i.name} ${i.grams*state.servings} g${i.note?'（'+i.note+'）':''}`).join('\n');try{await navigator.clipboard.writeText(value);$('#save-status').textContent='购物清单已复制。'}catch{$('#save-status').textContent='浏览器未开放复制权限，可从清单中手动选择复制。'}});
}
function renderFavorites(){const box=$('#favorites');box.innerHTML=state.favorites.length?state.favorites.map((ids,i)=>`<div class="favorite"><button type="button" data-favorite="${i}">${selected(ids).map(x=>x.name).join(' · ')}</button><button type="button" class="remove" data-remove="${i}" aria-label="删除这条收藏">×</button></div>`).join(''):'<p class="muted">还没有收藏的组合。</p>'}
function toggle(id:string){const i=ingredients.find(x=>x.id===id)!;if(state.ids.includes(id)){state.ids=state.ids.filter(x=>x!==id)}else{const same=selected(state.ids).filter(x=>x.group===i.group);if(['protein','grain','flavor'].includes(i.group)){state.ids=state.ids.filter(x=>!same.some(y=>y.id===x))}else if(i.group==='veg'&&same.length>=4){state.ids=state.ids.filter(x=>x!==same[0].id)}else if(i.group==='extra'&&same.length>=1){state.ids=state.ids.filter(x=>!same.some(y=>y.id===x))}if(state.ids.length>=8){$('#status').textContent='最多选择 8 种，请先移除一项。';return}state.ids.push(id)}render()}
$('#groups').addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');if(b)toggle(b.dataset.id!)});
$('#presets').addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');if(b){state.ids=[...presets[Number(b.dataset.preset)].ids];render();$('#result').scrollIntoView({behavior:'smooth',block:'start'})}});
$('#favorites').addEventListener('click',e=>{const t=e.target as HTMLElement;const remove=t.closest<HTMLButtonElement>('[data-remove]');if(remove){state.favorites.splice(Number(remove.dataset.remove),1);persist();renderFavorites();return}const b=t.closest<HTMLButtonElement>('[data-favorite]');if(b){state.ids=[...state.favorites[Number(b.dataset.favorite)]];render()}});
$('#random').addEventListener('click',()=>{const p=presets[Math.floor(Math.random()*presets.length)];state.ids=[...p.ids];render()});
$('#reset').addEventListener('click',()=>{state.ids=[];state.servings=1;render()});
$('#generate').addEventListener('click',()=>{$('#result').scrollIntoView({behavior:'smooth',block:'start'})});
$('#minus').addEventListener('click',()=>{state.servings=Math.max(1,state.servings-1);render()});
$('#plus').addEventListener('click',()=>{state.servings=Math.min(8,state.servings+1);render()});
$('#targets').innerHTML=([['kcal','热量','千卡'],['protein','蛋白质','克'],['fat','脂肪','克'],['carbs','碳水','克'],['fiber','膳食纤维','克'],['sodium','钠','毫克']] as const).map(([key,label,unit])=>`<label>${label}<span>${unit}</span><input type="number" min="1" max="10000" step="1" data-target="${key}" value="${state.targets[key]}"></label>`).join('');
$('#targets').addEventListener('change',e=>{const input=e.target as HTMLInputElement;const key=input.dataset.target as keyof Nutrients;if(!key)return;const value=Number(input.value);if(!Number.isFinite(value)||value<=0||value>10000){input.value=String(state.targets[key]);$('#save-status').textContent='每日参考值需在 1–10000 之间。';return}state.targets[key]=value;persist();render()});
$('#reset-targets').addEventListener('click',()=>{state.targets={...defaultTargets};$('#targets').querySelectorAll<HTMLInputElement>('input').forEach(input=>input.value=String(state.targets[input.dataset.target as keyof Nutrients]));persist();render()});
render();
