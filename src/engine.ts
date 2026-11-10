import { ingredients, baseOil, foodData, type Ingredient, type Nutrients } from './data';
export const byId=new Map(ingredients.map(i=>[i.id,i]));
export function selected(ids:string[],grams:Record<string,number>={}):Ingredient[]{return ids.map(id=>byId.get(id)).filter((x):x is Ingredient=>!!x).map(i=>({...i,grams:grams[i.id]??i.grams}))}
export function withBase(items:Ingredient[],grams:Record<string,number>={}):Ingredient[]{return [...items,{...baseOil,grams:grams.olive??baseOil.grams}]}
export function componentAmounts(item:Ingredient){return item.components.map(c=>({key:c.key,grams:item.grams*c.baseGrams/item.components.reduce((sum,x)=>sum+x.baseGrams,0)}))}
export function weightRange(item:Ingredient):[number,number]{return item.id==='olive'?[1,40]:item.group==='veg'?[10,400]:item.group==='protein'?[30,400]:item.group==='grain'?[10,200]:item.group==='flavor'?[1,120]:[1,100]}
export function validate(ids:string[]):string | null {
  const items=selected(ids), counts=(group:string)=>items.filter(i=>i.group===group).length;
  if(counts('veg')<1)return '请至少选择 1 种蔬菜。';
  if(counts('protein')>1)return '蛋白质最多选择 1 种。';
  if(counts('grain')>1)return '主食最多选择 1 种。';
  if(counts('flavor')>1)return '风味最多选择 1 种。';
  if(counts('extra')>1)return '可选配料最多 1 种。';
  if(ids.includes('yogurt')&&ids.includes('salmon'))return '酸奶蒜香酱不建议与这款热烤三文鱼同烤；请选择柠檬欧芹等风味。';
  if(ids.includes('feta')&&ids.includes('shrimp'))return '这款虾仁搭配不加入菲达奶酪；可换其他配料。';
  return null;
}
export function nutrition(items:Ingredient[]):Nutrients{
 const result:Nutrients={kcal:0,protein:0,fat:0,carbs:0,fiber:0,sodium:0};
 for(const item of items)for(const key of Object.keys(result) as (keyof Nutrients)[])result[key]+=item.nutrients[key]*item.grams/100;
 return result;
}
export function mealType(n:Nutrients,items:Ingredient[]):{label:string;reason:string}{
 const hasProtein=items.some(i=>i.group==='protein'),hasGrain=items.some(i=>i.group==='grain');
 if(!hasProtein&&!hasGrain)return {label:'午餐或晚餐的配菜',reason:'这是一盘蔬菜，可以搭配午餐或晚餐；若作为完整一餐，按需要另配蛋白质和主食。营养占比只反映当前所选食材。'};
 if(!hasProtein)return {label:'午餐或晚餐的一部分',reason:'已含蔬菜和主食，若作为完整一餐，可按需要另配蛋白质。营养占比只反映当前所选食材。'};
 if(!hasGrain)return {label:'午餐或晚餐的一部分',reason:'已含蔬菜和蛋白质，若作为完整一餐，可按需要另配主食。营养占比只反映当前所选食材。'};
 const hasBread=items.some(i=>i.id==='bread');
 const hasEgg=items.some(i=>i.id==='egg'),hasOats=items.some(i=>i.id==='oats');
 if(hasEgg&&(hasBread||hasOats)&&n.kcal<650)return {label:'早餐或午餐',reason:'鸡蛋搭配全谷主食和蔬菜，适合作为较充足的早餐或午餐。'};
 if(hasBread&&n.kcal<550)return {label:'早餐或午餐',reason:'面包搭配蛋白质和蔬菜，准备相对简便；热量适合较充足的早餐或轻午餐。'};
 if(n.kcal>=650)return {label:'午餐或晚餐',reason:'主食与蛋白质的份量较完整，适合作为主餐；按当天活动量调整主食。'};
 return {label:'午餐或晚餐',reason:'含蔬菜、蛋白质和主食，结构适合一顿正餐。'};
}
export function makeRecipe(items:Ingredient[], servings:number, oil:Ingredient=baseOil){
 const p=items.find(i=>i.group==='protein'),grain=items.find(i=>i.group==='grain'),flavor=items.find(i=>i.group==='flavor');
 const veg=items.filter(i=>i.group==='veg'),extras=items.filter(i=>i.group==='extra');
 const roastMode=veg.length>=3||(!p&&!grain);
 const oilGrams=oil.grams*servings;
 const vegNames=veg.map(i=>i.name).join('、');
 const named=(items:Ingredient[])=>items.map(i=>`${i.name} ${i.grams*servings} g`).join('、');
 const cutById:Record<string,string>={broccoli:'西兰花切小朵',zucchini:'西葫芦切约 2 cm 厚块',eggplant:'茄子切约 2 cm 块',tomato:'圣女果对半切',pepper:'彩椒去籽后切约 2 cm 块',mushroom:'蘑菇切半',redonion:'红洋葱切粗丝'};
 const prepProtein=!p?'':p.id==='chickpea'||p.id==='whitebean'?'豆类使用已彻底煮熟、沥干的成品。':p.id==='egg'?'鸡蛋打入碗中打散，接触生蛋的器具与熟食分开。':p.id==='salmon'?'三文鱼擦干并检查鱼刺，生熟器具分开。':p.id==='chicken'?'鸡腿肉擦干并摊平，生熟器具分开。':'虾仁沥干，生熟器具分开。';
 const prep=`洗净并沥干 ${vegNames}；${veg.map(i=>cutById[i.id]).join('；')}。${prepProtein}`;
 const flavorParts=flavor?componentAmounts(flavor).map(c=>`${foodData[c.key].name} ${c.grams*servings} g`):[];
 const grainGrams=(grain?.grams??0)*servings;
 const grainSteps:Record<string,string>={
  oats:`将燕麦片 ${grainGrams} g 加入约 3 倍重量的水，小锅煮约 5–8 分钟并搅拌，至软稠；做成咸口燕麦底。`,
  bulgur:`将布格麦 ${grainGrams} g 加入约 2 倍重量的沸水，加盖焖约 12–15 分钟，拨松并确认软熟。`,
  quinoa:`将藜麦 ${grainGrams} g 冲洗后加入约 2 倍重量的水，小火煮约 15 分钟，焖 5 分钟。`,
  pasta:`将全麦意面 ${grainGrams} g 放入沸水，按包装指示煮熟（通常约 8–12 分钟）；留约 30 ml 面汤后沥干。`,
  rice:`将糙米 ${grainGrams} g 洗净，加入约 1.8 倍体积的水，电饭煲或小锅煮约 30–40 分钟，焖 10 分钟。`,
  couscous:`将库斯库斯 ${grainGrams} g 加入等体积沸水，盖住焖 5–7 分钟后用叉拨松。`,
  bread:`将全麦面包 ${grainGrams} g 放入平底锅，小火烘约 2–4 分钟，翻面至微脆。`,
  purpleSweetPotato:`将紫薯洗净，去除坏损部分，按生重称取可食部分 ${grainGrams} g，切成约 2 cm 小块；放入蒸箱以 100℃ 蒸约 15–25 分钟，或放入沸水煮约 12–20 分钟，至筷子能轻松插入后沥干。可在烤蔬菜时同时蒸煮。`
 };
 const panFirst=veg.filter(i=>['eggplant','zucchini','pepper','redonion'].includes(i.id));
 const panLast=veg.filter(i=>['broccoli','tomato','mushroom'].includes(i.id));
 const blanch=veg.some(i=>i.id==='broccoli')?`先把西兰花 ${veg.find(i=>i.id==='broccoli')!.grams*servings} g 放入沸水焯约 2 分钟，捞出沥干。`:'';
 const panCook=panFirst.length&&panLast.length?`先放入 ${named(panFirst)}，翻炒约 5–7 分钟；再加入 ${named(panLast)}，继续翻炒约 3–5 分钟，至蔬菜熟软。`:panFirst.length?`放入 ${named(panFirst)}，翻炒约 8–12 分钟，至蔬菜熟软。`:`放入 ${named(panLast)}，翻炒约 3–5 分钟，至蔬菜熟软。`;
 const vegStep=`${blanch}平底锅加入 ${oilGrams} g 橄榄油（${oil.grams} g/人，已计入营养），中火加热。${panCook}${flavor?.id==='basil'?`蔬菜炒熟后加入切碎的${flavorParts[0]}，再炒约 1 分钟。`:''}${veg.length>=3?'如果锅放不下，按上述顺序分批炒，最后合并。':''}`;
 const early=panFirst,late=panLast;
 const ovenStages=early.length&&late.length?`先把 ${named(early)} 平铺在烤盘上，烤约 10–12 分钟；再加入 ${named(late)}，继续烤约 10–15 分钟。`: `把 ${named(veg)} 平铺在烤盘上，烤约 ${early.length?'20–25':'12–18'} 分钟。`;
 const ovenVegStep=`烤箱预热至 200℃。将 ${named(veg)} 与 ${oilGrams} g 橄榄油（${oil.grams} g/人，已计入营养）拌匀。${ovenStages}${flavor?.id==='basil'?`烤制结束前约 3 分钟，撒上切碎的${flavorParts[0]}。`:''}蔬菜要铺成单层；放不下就分到两盘，不要堆叠。中途翻动，烤至熟软；多盘可中途交换位置。`;
 const proteinSteps:Record<string,string>={
  salmon:'把蔬菜盛出；三文鱼用同一平底锅中火两面各煎约 3–5 分钟，厚度不同需调整，最厚处中心达到 63℃。',
  chicken:'把蔬菜盛出；鸡腿肉摊平，用同一平底锅中火每面约 6–8 分钟，最厚处中心达到 74℃。',
  shrimp:'把蔬菜盛出；虾仁用同一平底锅中火翻炒约 3–5 分钟，至肉质呈珍珠白且不透明。',
  chickpea:'把熟鹰嘴豆加入炒好的蔬菜中，翻炒约 2–3 分钟至热透。',
  whitebean:'把熟白芸豆加入炒好的蔬菜中，翻炒约 2–3 分钟至热透。',
  egg:'鸡蛋打散后倒入平底锅，中小火翻炒至蛋液完全凝固；生熟器具分开。'
 };
 const roastedProteinSteps:Record<string,string>={
  salmon:'蔬菜烤制时，三文鱼另用平底锅中火两面各煎约 3–5 分钟；最厚处中心达到 63℃。',
  chicken:'蔬菜烤制时，鸡腿肉另用平底锅中火每面约 6–8 分钟；最厚处中心达到 74℃。',
  shrimp:'蔬菜烤制时，虾仁另用平底锅中火翻炒约 3–5 分钟；至肉质呈珍珠白且不透明。',
  chickpea:'蔬菜烤熟后拌入已煮熟的鹰嘴豆，回炉约 3–5 分钟至热透。',
  whitebean:'蔬菜烤熟后拌入已煮熟的白芸豆，回炉约 3–5 分钟至热透。',
  egg:'蔬菜烤制时，鸡蛋另在平底锅中小火炒至蛋液完全凝固；生熟器具分开。'
 };
 const sauce=!flavor?'':flavor.id==='yogurt'?`将${flavorParts[0]}与切碎的${flavorParts[1]}拌匀，保持冷藏；装盘后淋上，不要让酱料接触生肉。`:flavor.id==='basil'?`关火后拌入${flavorParts[1]}。`:`关火后拌入${flavorParts.join('、')}。`;
 const extra=extras.length?`最后加入${named(extras)}。`:'';
 const grainName=grain?.name.replace(/（干）|（生）/g,'');
 const finish=grain?.id==='pasta'?`将煮熟的意面、${vegNames}${p?`、${p.name}`:''}放回锅中，按需要加少量预留面汤拌匀。`:`将${grainName?`${grainName}、`:''}${vegNames}${p?`、${p.name}`:''}装盘。`;
 const steps=[prep,...(grain?[grainSteps[grain.id]]:[]),roastMode?ovenVegStep:vegStep,...(p?[roastMode?roastedProteinSteps[p.id]:proteinSteps[p.id]]:[]),`${finish}${sauce}${extra}即可食用。`];
 const steam=!p?'蔬菜以 100℃ 蒸约 6–10 分钟，至熟软。':p.id==='chicken'?'鸡腿肉 100℃ 蒸约 18–25 分钟，中心 74℃；蔬菜另蒸 6–10 分钟。':p.id==='salmon'?'鱼 100℃ 蒸约 8–12 分钟，中心 63℃；蔬菜另蒸 6–10 分钟。':p.id==='shrimp'?'虾仁 100℃ 蒸约 5–8 分钟，至肉质呈珍珠白且不透明；蔬菜另蒸 6–10 分钟。':p.id==='egg'?'鸡蛋可在耐热容器中以 100℃ 蒸至完全凝固，蛋料理中心达到 71℃；蔬菜另蒸 6–10 分钟。':'熟豆类与蔬菜 100℃ 蒸约 6–10 分钟，至热透。';
 const pan=roastMode?`${vegStep}${p?proteinSteps[p.id]:''}`:undefined;
 const airFryer=`将 ${named(veg)} 拌入 ${oilGrams} g 橄榄油，空气炸锅 180℃ 约 10–15 分钟，中途翻动；蔬菜多时分批。${!p?'':p.id==='chicken'?'鸡腿肉另以 180℃ 约 16–22 分钟，中途翻面，中心 74℃。':p.id==='salmon'?'三文鱼另以 180℃ 约 10–14 分钟，中心 63℃。':p.id==='shrimp'?'虾仁另以 180℃ 约 6–9 分钟，至肉质呈珍珠白且不透明。':p.id==='egg'?'鸡蛋另用平底锅炒至完全凝固。':'熟豆类在蔬菜出锅后拌入并加热至热透。'}${grain?'主食仍按上方步骤准备。':''}`;
 const microwave=p&&['chicken','salmon','shrimp','egg'].includes(p.id)?'微波炉更适合加热蔬菜和已煮熟主食：加盖留缝，以约 800 W 加热 2–4 分钟，中途翻拌；生鲜鱼禽和鸡蛋建议按锅或蒸箱方案烹调并确认熟透。加热后拌入本餐橄榄油。':`蔬菜${p?'与熟豆类':''}${grain?'、已煮熟主食':''}加盖留缝，以约 800 W 分批加热，每次 2–4 分钟，中途翻拌；按份量重复至熟软或热透，静置 1 分钟。加热后拌入本餐橄榄油。`;
 const safety=!p?'蔬菜洗净；烤盘上铺成单层，避免拥挤导致受热不均。':p.id==='chicken'?'鸡肉中心须达到 74℃，用食物温度计测最厚处；生熟器具分开。':p.id==='salmon'?'鱼中心达到 63℃，用食物温度计确认；生熟器具分开。':p.id==='shrimp'?'虾仁煮至肉质呈珍珠白且不透明；生熟器具分开。':p.id==='egg'?'整蛋应煮至蛋黄与蛋白凝固；炒蛋、烤蛋等蛋料理中心达到 71℃。生熟器具分开。':'若从干鹰嘴豆或干芸豆开始，先按包装浸泡，换水后彻底煮熟；此处克数按熟豆计，不能把浸泡当作煮熟。';
 return {steps,steam:grain?.id==='purpleSweetPotato'?`${steam}紫薯另切约 2 cm 块，以 100℃ 蒸约 15–25 分钟，至筷子能轻松插入。`:steam,pan,airFryer,microwave,safety,time:grain?.id==='rice'?'约 45–55 分钟':roastMode||p?.id==='chicken'?'约 35–45 分钟':'约 25–35 分钟',servings};
}
