import { ingredients, groups, presets, defaultTargets, baseOil, foodData, type Ingredient, type Nutrients } from './data';
import { selected, withBase, validate, nutrition, mealType, makeRecipe, componentAmounts, weightRange } from './engine';
import { generateAiSteps, type AiRecipeResult } from './ai';
import { favoriteSignature, normalizeFavorites, normalizeGrams, type Favorite } from './favorites';
import { FavoriteSync } from './favorite-sync';
import { cloud, onSessionChange, sendLoginLink, signOut, listCloudFavorites, saveCloudFavorite, deleteCloudFavorite } from './cloud';

type State={ids:string[];servings:number;grams:Record<string,number>;targets:Nutrients;favorites:Favorite[]};
const storageKey='mediterranean-mixer-v1';
function readSaved():Partial<State>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}}
const saved=readSaved();
const anonymousFavorites=normalizeFavorites(saved.favorites);
const normalizeTargets=(raw:unknown):Nutrients=>{const out={...defaultTargets};if(raw&&typeof raw==='object')for(const key of Object.keys(out) as (keyof Nutrients)[]){const value=(raw as Partial<Nutrients>)[key];if(typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=10000)out[key]=value}return out};
const state:State={ids:[...presets[0].ids],servings:1,grams:normalizeGrams(saved.grams),targets:normalizeTargets(saved.targets),favorites:[...anonymousFavorites]};
const aiPage=location.protocol==='file:'||location.pathname.endsWith('/ai.html');
const aiDraftKey='mediterranean-mixer-ai-draft';
if(aiPage&&location.protocol!=='file:')try{const draft=JSON.parse(sessionStorage.getItem(aiDraftKey)||'null');sessionStorage.removeItem(aiDraftKey);if(draft&&Array.isArray(draft.ids)&&!validate(draft.ids)){state.ids=draft.ids;state.grams=normalizeGrams(draft.grams);if(Number.isInteger(draft.servings))state.servings=Math.max(1,Math.min(8,draft.servings))}}catch{}
let aiResult:AiRecipeResult|null=null,aiSignature='',aiCalls=0,aiPending=false;
const $=(selector:string)=>document.querySelector(selector) as HTMLElement;
const fmt=(n:number,d=0)=>n.toFixed(d).replace(/\.0$/,'');
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let activeUserId:string|null=null;
let favoritePending=false,toastTimer=0;
function showToast(message:string){const box=$('#toast');box.textContent=message;$('#save-status').textContent=message;box.classList.add('visible');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>box.classList.remove('visible'),4800)}
function showFavoriteFeedback(message:string){const box=document.querySelector('#favorite-feedback');if(box)box.textContent=message}
function currentFavorite():Favorite{return {ids:[...state.ids],grams:Object.fromEntries(withBase(selected(state.ids,state.grams),state.grams).map(i=>[i.id,i.grams]))}}
function updateFavoriteButton(){const button=document.querySelector<HTMLButtonElement>('#favorite-btn');if(!button)return;const saved=state.favorites.some(f=>favoriteSignature(f)===favoriteSignature(currentFavorite()));button.textContent=saved?'★ 已收藏':'☆ 收藏组合';button.classList.toggle('saved',saved);button.setAttribute('aria-pressed',String(saved))}
function openAccount(message='登录后可在设备间同步收藏。'){const dialog=$('#account-dialog') as HTMLDialogElement;$('#dialog-context').textContent=message;if(!dialog.open)dialog.showModal();(dialog.querySelector('#login-email') as HTMLInputElement|null)?.focus()}
function closeAccount(){const dialog=$('#account-dialog') as HTMLDialogElement;if(dialog.open)dialog.close()}
const safeStore={getItem:(key:string)=>{try{return localStorage.getItem(key)}catch{return null}},setItem:(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}}};
const sync=cloud?new FavoriteSync(
 {list:listCloudFavorites,add:saveCloudFavorite,delete:deleteCloudFavorite},
 safeStore,
 favorites=>{state.favorites=favorites;renderFavorites()},
 message=>{$('#account-status').textContent=message;if(favoritePending&&message!=='正在同步收藏…'){const result=message==='收藏已同步。'?'已加入收藏，并同步到账户。':'已加入收藏，暂时无法同步；联网后可重试。';showFavoriteFeedback(result);showToast(result);favoritePending=false}}
):null;
function renderAccount(email=''){
 const box=$('#account');
 const trigger=$('#account-trigger'),label=$('#account-trigger-label');
 trigger.classList.toggle('logged-in',!!activeUserId);
 if(!cloud){label.textContent='本机模式';box.innerHTML='<p class="helper">当前离线页面仅在本机保存收藏。请打开在线网页登录并同步。</p>';return}
 if(activeUserId){label.textContent='我的账户';box.innerHTML=`<p class="helper">已登录：<strong data-clarity-mask="true">${esc(email)}</strong></p><div class="account-actions"><button type="button" id="sync-favorites" class="secondary">同步收藏</button><button type="button" id="sign-out" class="text-btn">退出登录</button></div>`;return}
 label.textContent='登录 / 注册';
 box.innerHTML='<p class="helper">用邮箱接收登录链接，登录后可在设备间同步收藏。首次登录会自动创建账户。</p><form id="login-form" class="login-form"><label for="login-email">邮箱地址</label><input id="login-email" type="email" autocomplete="email" required data-clarity-mask="true" placeholder="name@example.com"><button class="secondary" type="submit">发送登录链接</button></form>';
}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({targets:state.targets,grams:state.grams,favorites:anonymousFavorites}))}catch{$('#save-status').textContent='此浏览器未开放本地存储；本次会话仍可使用。'}}
function componentText(item:Ingredient,multiplier=1){return item.components.length>1?componentAmounts(item).map(c=>`${foodData[c.key].name} ${fmt(c.grams*multiplier,1)} g`).join('、'):''}
function icon(){return `<svg class="plate-art" viewBox="0 0 460 300" role="img" aria-label="餐盘示意插图"><defs><radialGradient id="plate"><stop stop-color="#fff"/><stop offset="1" stop-color="#e6e3dc"/></radialGradient><filter id="shadow"><feGaussianBlur stdDeviation="8"/></filter></defs><ellipse cx="232" cy="262" rx="188" ry="20" fill="#b2b9a6" opacity=".3" filter="url(#shadow)"/><ellipse cx="230" cy="148" rx="190" ry="134" fill="#d8d7ce"/><ellipse cx="230" cy="142" rx="177" ry="124" fill="url(#plate)"/><ellipse cx="230" cy="142" rx="155" ry="104" fill="#f9f8f3"/><path d="M90 135C125 76 176 53 222 70c-37 40-28 83-4 123-57 26-105 9-128-58Z" fill="#c6a377"/><path d="M123 93c32-28 63-34 90-20-22 25-30 45-26 66-26 3-47-7-64-46Z" fill="#f0dba6"/><path d="M250 58c65-9 113 24 122 79-28 18-52 16-77 0-25-17-41-42-45-79Z" fill="#e57759"/><path d="M268 67c32-6 65 7 83 31-30 0-53-8-83-31Z" fill="#f3ad8a"/><g fill="#637d4e"><circle cx="131" cy="186" r="30"/><circle cx="165" cy="200" r="22"/><circle cx="99" cy="174" r="18"/><circle cx="309" cy="208" r="24"/><circle cx="339" cy="185" r="21"/></g><g fill="#b7bd6c"><circle cx="122" cy="180" r="12"/><circle cx="151" cy="196" r="10"/><circle cx="320" cy="203" r="10"/></g><g fill="#d85b46"><circle cx="230" cy="218" r="15"/><circle cx="257" cy="207" r="13"/><circle cx="290" cy="225" r="14"/></g><g fill="#f3e9bd"><circle cx="204" cy="219" r="7"/><circle cx="186" cy="205" r="7"/><circle cx="211" cy="190" r="7"/></g><path d="M207 40c12 14 26 19 42 18M89 224c20 19 42 26 68 27" stroke="#f6f3e6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`}
function render(){
 const signature=JSON.stringify([state.ids,state.grams,state.servings]);if(signature!==aiSignature){aiSignature=signature;aiResult=null}
 const items=selected(state.ids,state.grams),allItems=withBase(items,state.grams),err=validate(state.ids),n=nutrition(allItems),meal=!err?mealType(n,allItems):null,recipe=!err?makeRecipe(items,state.servings,allItems.find(i=>i.id==='olive')):null;
 $('#groups').innerHTML=groups.map(g=>`<section class="group"><div class="group-title"><h3>${g.label}</h3><span>${g.hint}</span></div><div class="chips">${ingredients.filter(i=>i.group===g.id).map(i=>`<button class="chip ${state.ids.includes(i.id)?'active':''}" type="button" data-id="${i.id}" aria-pressed="${state.ids.includes(i.id)}">${i.name}</button>`).join('')}</div></section>`).join('');
 $('#presets').innerHTML=presets.map((p,i)=>`<button type="button" class="preset" data-preset="${i}"><strong>${p.name}</strong><small>${p.description}</small></button>`).join('');
 $('#selection').innerHTML=(items.length?items.map(i=>`<span class="selected-chip">${i.name}</span>`).join(''):'<span class="muted">从左侧选择食材</span>')+`<span class="selected-chip base-chip">橄榄油 · 每人 ${state.grams.olive??baseOil.grams} g（基础用油）</span>`;
 $('#selection-count').textContent=`${items.length} 种（另含橄榄油）`;
 $('#status').textContent=err||'组合合理，可以生成菜谱。';$('#status').className=err?'status error':'status good';
 ($('#generate') as HTMLButtonElement).disabled=!!err;
 $('#servings-value').textContent=String(state.servings);
 renderResult(allItems,n,meal,recipe,err);
 renderFavorites();
}
function renderResult(items:ReturnType<typeof selected>,n:Nutrients,meal:ReturnType<typeof mealType>|null,recipe:ReturnType<typeof makeRecipe>|null,err:string|null){
 if(err||!recipe||!meal){$('#result').innerHTML=`<div class="empty"><span class="empty-mark">✳</span><h2>餐盘还差一步</h2><p>${esc(err||'请选择食材')}</p></div>`;return}
 const p=items.find(i=>i.group==='protein'),flavor=items.find(i=>i.group==='flavor'),vegs=items.filter(i=>i.group==='veg').map(i=>i.name),v=vegs.length>2?'杂蔬':vegs.join('与');
 const title=p?`${flavor?flavor.name+'·':''}${p.name}${v?'配'+v:''}`:`${flavor?flavor.name+'·':''}${vegs.length>2?'烤杂蔬':'烤'+v}`;
 const fields:[keyof Nutrients,string,string,number][]=[['kcal','热量','千卡',0],['protein','蛋白质','克',1],['fat','脂肪','克',1],['carbs','碳水','克',1],['fiber','膳食纤维','克',1],['sodium','钠','毫克',0]];
 const nutritionHtml=fields.map(([k,label,unit,dec])=>{const pct=Math.round(n[k]/state.targets[k]*100);return `<div class="nutrient"><div><strong>${label}</strong><span>${fmt(n[k],dec)} ${unit} · 每日 ${pct}%</span></div><div class="bar"><i style="width:${Math.min(100,pct)}%"></i></div></div>`}).join('');
 const list=items.map(i=>{const [min,max]=weightRange(i);return `<li><span><strong>${i.name}</strong>${componentText(i)?`<small>按比例：${componentText(i)}</small>`:''}</span><span class="gram-control"><input type="number" data-gram="${i.id}" min="${min}" max="${max}" step="1" value="${i.grams}" aria-label="${i.name}每人克数"><span>g / 人</span><small>共 ${fmt(i.grams*state.servings,1)} g</small></span></li>`}).join('');
 const shopping=items.map(i=>`<label class="shop-item"><input type="checkbox"><span>${i.name} · ${fmt(i.grams*state.servings,1)} g${componentText(i)?`（${componentText(i,state.servings)}）`:''}</span></label>`).join('');
 const sourceHtml=items.map(i=>`<article class="source-item"><strong>${i.name}</strong>${i.sourceNote?`<p>${i.sourceNote}</p>`:''}${i.components.map(c=>{const f=foodData[c.key];return `<div class="source-record"><span>${f.name}${i.components.length>1?` · 默认配比 ${c.baseGrams} g`:''}</span><a href="https://fdc.nal.usda.gov/food-search/?query=${f.fdcId}" target="_blank" rel="noopener">FDC 食品编号 ${f.fdcId}</a><small>${f.dataType==='Foundation Foods'?'基础食物数据':'传统参考数据'} · ${f.release} · ${f.description} · 能量项目 ${f.energyNutrientId} · 每 100 g：${f.nutrients.kcal} 千卡、蛋白质 ${f.nutrients.protein} g、脂肪 ${f.nutrients.fat} g、碳水 ${f.nutrients.carbs} g、纤维 ${f.nutrients.fiber} g、钠 ${f.nutrients.sodium} mg${f.assumption?`；${f.assumption}`:''}</small></div>`}).join('')}</article>`).join('');
 $('#result').innerHTML=`<div class="result-top"><div><div class="eyebrow">为你生成的一餐 / ${state.servings} 人份</div><h2>${title}</h2><p>${meal.label} · ${recipe.time}</p></div><div class="art-wrap">${icon()}<span>餐盘示意插图</span></div></div>
 <div class="result-actions"><button type="button" id="favorite-btn" aria-pressed="false">☆ 收藏组合</button><button type="button" id="print-btn">↗ 打印菜谱</button><button type="button" id="reset-grams">恢复默认克数</button></div><p id="favorite-feedback" class="favorite-feedback"></p>
 <div class="result-grid"><div class="recipe-pane"><div class="section-heading"><h3>食材清单</h3><span>以下为 ${state.servings} 人份</span></div><ul class="ingredient-list">${list}</ul><div class="section-heading"><h3>开始烹调</h3><span>${aiResult?'AI 辅助步骤':'按顺序操作'}</span></div>${aiResult?'<p class="ai-notice">以下步骤由 DeepSeek 改写，请核对食材、火候和下方食安提示。<button type="button" id="restore-steps" class="text-btn">恢复本地步骤</button></p>':''}<ol class="steps">${(aiResult?.steps??recipe.steps).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="method-box"><h4>换用其他设备</h4>${recipe.pan?`<p><strong>平底锅：</strong>${recipe.pan}</p>`:''}<p><strong>蒸箱：</strong>${recipe.steam}出锅后拌入本餐橄榄油。</p><p><strong>空气炸锅：</strong>${recipe.airFryer}</p><p><strong>微波炉：</strong>${recipe.microwave}</p></div><div class="safety"><strong>食安提示</strong><p>${recipe.safety}</p></div></div>
 <aside class="nutrition-pane"><div class="section-heading"><h3>每份营养估算</h3><span>约值</span></div>${nutritionHtml}<p class="nutrition-note">按下方食品编号对应的每 100 g 数据和所填克数线性计算；复合风味按默认比例缩放。未计烹调损耗、额外盐油、品牌差异及近似品种映射误差。不是个体医疗或营养建议。</p><div class="meal-note"><strong>适合 ${meal.label}</strong><p>${meal.reason}</p></div></aside></div>
 <section class="shopping-section"><div class="section-heading"><h3>购物清单</h3><span>勾选仅在当前页面有效</span></div><div class="shop-list">${shopping}</div><button type="button" id="copy-list">复制购物清单</button></section><details class="source-section"><summary>查看每项食材的营养数据来源</summary><p>来源为美国农业部食品营养数据库的离线摘录。点击食品编号可在美国农业部网站按编号检索原始条目；复合风味按各组成食材加权。能量采用来源条目的 1008 或 2047 项。数值不是成品的实验室检测值。</p><div class="source-grid">${sourceHtml}</div></details>`;
 updateFavoriteButton();
 $('#favorite-btn')!.addEventListener('click',()=>{const snapshot=currentFavorite(),alreadySaved=state.favorites.some(f=>favoriteSignature(f)===favoriteSignature(snapshot));if(activeUserId&&sync){if(alreadySaved){showFavoriteFeedback('这个组合已经在收藏中。');showToast('这个组合已经在收藏中。');return}favoritePending=true;sync.add(snapshot);showFavoriteFeedback('已加入收藏，正在同步…');showToast('已加入收藏，正在同步…');return}if(!alreadySaved){anonymousFavorites.unshift(snapshot);anonymousFavorites.splice(100);state.favorites=[...anonymousFavorites];persist();renderFavorites()}const message=cloud?'已暂存于本机，登录后自动同步。':'已保存到本机收藏。';showFavoriteFeedback(message);showToast(message);if(cloud)openAccount('当前组合已暂存于本机。登录后会自动同步到你的账户。')});
 $('#print-btn')!.addEventListener('click',()=>window.print());
 $('#restore-steps')?.addEventListener('click',()=>{aiResult=null;render()});
 $('#reset-grams')!.addEventListener('click',()=>{state.grams={};persist();render()});
 $('#result').querySelectorAll<HTMLInputElement>('[data-gram]').forEach(input=>input.addEventListener('change',()=>{const id=input.dataset.gram!;const item=[...ingredients,baseOil].find(i=>i.id===id)!;const [min,max]=weightRange(item);const value=Number(input.value);if(!Number.isInteger(value)||value<min||value>max){input.value=String(state.grams[id]??item.grams);$('#save-status').textContent=`${item.name}每人克数需为 ${min}–${max} g 的整数。`;return}state.grams[id]=value;persist();render()}));
 $('#copy-list')!.addEventListener('click',async()=>{const value=items.map(i=>`${i.name} ${fmt(i.grams*state.servings,1)} g${componentText(i)?'（'+componentText(i,state.servings)+'）':''}`).join('\n');try{await navigator.clipboard.writeText(value);$('#save-status').textContent='购物清单已复制。'}catch{$('#save-status').textContent='浏览器未开放复制权限，可从清单中手动选择复制。'}});
}
function renderFavorites(){const box=$('#favorites');box.innerHTML=state.favorites.length?state.favorites.map((f,i)=>`<div class="favorite"><button type="button" data-favorite="${i}">${selected(f.ids).map(x=>x.name).join(' · ')}</button><button type="button" class="remove" data-remove="${i}" aria-label="删除这条收藏">×</button></div>`).join(''):'<p class="muted">还没有收藏的组合。</p>';updateFavoriteButton()}
function toggle(id:string){const i=ingredients.find(x=>x.id===id)!;if(state.ids.includes(id)){state.ids=state.ids.filter(x=>x!==id)}else{const same=selected(state.ids).filter(x=>x.group===i.group);if(['protein','grain','flavor'].includes(i.group)){state.ids=state.ids.filter(x=>!same.some(y=>y.id===x))}else if(i.group==='extra'&&same.length>=1){state.ids=state.ids.filter(x=>!same.some(y=>y.id===x))}state.ids.push(id)}render()}
$('#groups').addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-id]');if(b)toggle(b.dataset.id!)});
$('#presets').addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');if(b){state.ids=[...presets[Number(b.dataset.preset)].ids];state.grams={};persist();render();$('#result').scrollIntoView({behavior:'smooth',block:'start'})}});
$('#favorites').addEventListener('click',e=>{const t=e.target as HTMLElement;const remove=t.closest<HTMLButtonElement>('[data-remove]');if(remove){const favorite=state.favorites[Number(remove.dataset.remove)];if(!favorite)return;if(activeUserId&&sync)sync.remove(favorite);else{anonymousFavorites.splice(Number(remove.dataset.remove),1);state.favorites=[...anonymousFavorites];persist();renderFavorites()}showToast('已从收藏移除。');return}const b=t.closest<HTMLButtonElement>('[data-favorite]');if(b){const f=state.favorites[Number(b.dataset.favorite)];state.ids=[...f.ids];state.grams={...f.grams};persist();render()}});
$('#random').addEventListener('click',()=>{const p=presets[Math.floor(Math.random()*presets.length)];state.ids=[...p.ids];state.grams={};persist();render()});
$('#reset').addEventListener('click',()=>{state.ids=[];state.servings=1;state.grams={};persist();render()});
$('#generate').addEventListener('click',()=>{$('#result').scrollIntoView({behavior:'smooth',block:'start'})});
$('#minus').addEventListener('click',()=>{state.servings=Math.max(1,state.servings-1);render()});
$('#plus').addEventListener('click',()=>{state.servings=Math.min(8,state.servings+1);render()});
$('#targets').innerHTML=([['kcal','热量','千卡'],['protein','蛋白质','克'],['fat','脂肪','克'],['carbs','碳水','克'],['fiber','膳食纤维','克'],['sodium','钠','毫克']] as const).map(([key,label,unit])=>`<label>${label}<span>${unit}</span><input type="number" min="1" max="10000" step="1" data-target="${key}" value="${state.targets[key]}"></label>`).join('');
$('#targets').addEventListener('change',e=>{const input=e.target as HTMLInputElement;const key=input.dataset.target as keyof Nutrients;if(!key)return;const value=Number(input.value);if(!Number.isFinite(value)||value<=0||value>10000){input.value=String(state.targets[key]);$('#save-status').textContent='每日参考值需在 1–10000 之间。';return}state.targets[key]=value;persist();render()});
$('#reset-targets').addEventListener('click',()=>{state.targets={...defaultTargets};$('#targets').querySelectorAll<HTMLInputElement>('input').forEach(input=>input.value=String(state.targets[input.dataset.target as keyof Nutrients]));persist();render()});
const aiBox=$('#ai-controls');
if(aiPage){
 aiBox.innerHTML='<p class="helper">联网后可用自己的 DeepSeek 密钥改写当前做法。点击时会将所选食材、克数和本地步骤发送给 DeepSeek。密钥只用于本次请求，不写入网页、收藏或浏览器存储；每次点击都会产生 API 用量。</p><label class="ai-label" for="ai-key">DeepSeek API 密钥</label><input id="ai-key" class="ai-key" type="password" autocomplete="off" spellcheck="false" data-clarity-mask="true" placeholder="输入自己的密钥"><button id="ai-generate" type="button" class="secondary">用 DeepSeek 改写步骤</button><p class="helper">每页最多调用 3 次；每次最多生成 900 个输出 token。刷新页面会重置次数，这不是账户额度上限。提交后输入框会清空。AI 可能出错，请核对步骤。</p><p id="ai-status" class="status" role="status"></p>';
 $('#ai-generate').addEventListener('click',async()=>{
  if(aiPending)return;
  const status=$('#ai-status'),keyInput=$('#ai-key') as HTMLInputElement,key=keyInput.value.trim();
  if(!key){status.textContent='请先输入自己的 DeepSeek 密钥。';return}
  const err=validate(state.ids);if(err){status.textContent=err;return}
  if(aiCalls>=3){status.textContent='本页已达到 3 次调用上限。';return}
  keyInput.value='';aiCalls++;aiPending=true;aiResult=null;render();($('#ai-generate') as HTMLButtonElement).disabled=true;
  status.textContent=`正在生成清楚的步骤（本页第 ${aiCalls}/3 次调用）…`;
  const signature=aiSignature,items=withBase(selected(state.ids,state.grams),state.grams);
  const recipe=makeRecipe(items.filter(i=>i.id!=='olive'),state.servings,items.find(i=>i.id==='olive'));
  try{const result=await generateAiSteps(key,{items,servings:state.servings,steps:recipe.steps,safety:recipe.safety});if(signature!==aiSignature){status.textContent='食材已改变，已丢弃过时的 AI 步骤。';return}aiResult=result;render();status.textContent=`已生成；本次使用 ${result.totalTokens??'未返回'} 个 token（计费以 DeepSeek 账户记录为准）。`}
  catch(error){status.textContent=(error instanceof Error?error.message:'生成失败。')+' 已保留本地步骤。'}
  finally{aiPending=false;($('#ai-generate') as HTMLButtonElement).disabled=aiCalls>=3}
 });
}else{
 aiBox.innerHTML='<p class="helper">在线站点不会公开或代存你的 DeepSeek 密钥。需要 AI 改写时，打开独立页面并临时输入自己的密钥；普通菜谱继续免费、离线可用。</p><a class="secondary ai-link" id="ai-link" href="./ai.html">打开 AI 菜谱页 ↗</a>';
 $('#ai-link').addEventListener('click',()=>{try{sessionStorage.setItem(aiDraftKey,JSON.stringify({ids:state.ids,grams:state.grams,servings:state.servings}))}catch{}});
}
render();
renderAccount();
$('#account-trigger').addEventListener('click',()=>openAccount(activeUserId?'查看账户与同步状态。':'登录后可在设备间同步收藏。'));
$('#close-account').addEventListener('click',closeAccount);
$('#account-dialog').addEventListener('click',e=>{if(e.target===$('#account-dialog'))closeAccount()});
$('#account').addEventListener('submit',async e=>{
 const form=(e.target as HTMLElement).closest<HTMLFormElement>('#login-form');if(!form)return;e.preventDefault();
 const email=(form.querySelector('#login-email') as HTMLInputElement).value.trim();
 const button=form.querySelector('button') as HTMLButtonElement;button.disabled=true;
 $('#account-status').textContent='正在发送登录链接…';
 try{await sendLoginLink(email);$('#account-status').textContent='登录链接已发送，请在同一浏览器打开邮件中的链接。'}
 catch(error){$('#account-status').textContent=error instanceof Error?error.message:'发送失败，请稍后重试。'}
 finally{button.disabled=false}
});
$('#account').addEventListener('click',async e=>{
 const target=e.target as HTMLElement;
 if(target.closest('#sync-favorites')){void sync?.sync();return}
 if(target.closest('#sign-out')){try{await signOut()}catch(error){$('#account-status').textContent=error instanceof Error?error.message:'退出失败。'}}
});
onSessionChange(session=>{
 const userId=session?.user.id??null;
 if(userId===activeUserId){renderAccount(session?.user.email??'');return}
 const wasSignedIn=!!activeUserId;
 if(activeUserId)sync?.stop();
 activeUserId=userId;
 if(userId){renderAccount(session?.user.email??'');closeAccount();void sync?.start(userId,anonymousFavorites);if(anonymousFavorites.length){anonymousFavorites.splice(0);persist()}}
 else{state.favorites=[...anonymousFavorites];renderFavorites();renderAccount();$('#account-status').textContent=wasSignedIn?'已退出，当前显示本机收藏。':'';if(wasSignedIn)showToast('已退出登录，当前显示本机收藏。')}
});
window.addEventListener('online',()=>{if(activeUserId)void sync?.sync()});
