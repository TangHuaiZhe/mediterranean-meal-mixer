import { ingredients, baseOil, type Ingredient, type Nutrients } from './data';
export const byId=new Map(ingredients.map(i=>[i.id,i]));
export function selected(ids:string[]):Ingredient[]{return ids.map(id=>byId.get(id)).filter((x):x is Ingredient=>!!x)}
export function withBase(items:Ingredient[]):Ingredient[]{return [...items,baseOil]}
export function validate(ids:string[]):string | null {
  const items=selected(ids), counts=(group:string)=>items.filter(i=>i.group===group).length;
  if(items.length<4||items.length>8)return '请选择 4–8 种元素。';
  if(counts('veg')<1||counts('veg')>4)return '蔬菜请选择 1–4 种。';
  if(counts('protein')!==1)return '蛋白质请选择 1 种。';
  if(counts('grain')!==1)return '主食请选择 1 种。';
  if(counts('flavor')!==1)return '风味请选择 1 种。';
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
 const hasBread=items.some(i=>i.id==='bread');
 if(hasBread&&n.kcal<550)return {label:'早餐或午餐',reason:'面包搭配蛋白质和蔬菜，准备相对简便；热量适合较充足的早餐或轻午餐。'};
 if(n.kcal>=650)return {label:'午餐或晚餐',reason:'谷物与蛋白质的份量较完整，适合作为主餐；按当天活动量调整主食。'};
 return {label:'午餐或晚餐',reason:'含蔬菜、蛋白质和全谷主食，结构适合一顿正餐。'};
}
export function makeRecipe(items:Ingredient[], servings:number){
 const p=items.find(i=>i.group==='protein')!,grain=items.find(i=>i.group==='grain')!,flavor=items.find(i=>i.group==='flavor')!;
 const veg=items.filter(i=>i.group==='veg'),extras=items.filter(i=>i.group==='extra');
 const oilGrams=baseOil.grams*servings;
 const prep=`洗净并沥干 ${veg.map(i=>i.name).join('、')}；${veg.some(i=>i.id==='redonion')?'红洋葱切丝，其余蔬菜':'蔬菜'}切成约 2 cm 块。${p.id==='chickpea'||p.id==='whitebean'?'豆类使用已彻底煮熟、沥干的成品。':'生鲜蛋白质单独处理，生熟器具分开。'}`;
 const grainSteps:Record<string,string>={
  oats:'燕麦片加约 3 倍重量的水，小锅煮约 5–8 分钟并搅拌，至软稠；做成咸口燕麦底。',
  bulgur:'布格麦加约 2 倍重量的沸水，加盖焖约 12–15 分钟，拨松并确认软熟。',
  quinoa:'藜麦冲洗后加约 2 倍重量的水，小火煮约 15 分钟，焖 5 分钟。',
  pasta:'意面放入沸水煮约 8–12 分钟，按包装指示煮熟；留约 30 ml 面汤后沥干。',
  rice:'糙米洗净，加约 1.8 倍体积的水，电饭煲或小锅煮约 30–40 分钟，焖 10 分钟。',
  couscous:'库斯库斯加等体积沸水，盖住焖 5–7 分钟后用叉拨松。',
  bread:'全麦面包放入平底锅小火烘约 2–4 分钟，翻面至微脆。'
 };
 const vegStep=`平底锅加入 ${oilGrams} g 橄榄油（${baseOil.grams} g/人，已计入营养），中火加热；${veg.some(i=>i.id==='eggplant')?'先下茄子炒约 3 分钟，再下其他蔬菜；':''}${veg.some(i=>i.id==='redonion')?'红洋葱与其他蔬菜一起下锅；':''}翻炒约 8–12 分钟至熟软。${veg.some(i=>i.id==='broccoli')?'西兰花可先焯水约 2 分钟再下锅。':''}${veg.length>=3?'蔬菜较多，分批炒熟后合并，避免锅中堆叠。':''}`;
 const proteinSteps:Record<string,string>={
  salmon:'把蔬菜盛出；三文鱼用同一平底锅中火两面各煎约 3–5 分钟，厚度不同需调整，最厚处中心达到 63℃。',
  chicken:'把蔬菜盛出；鸡腿肉摊平，用同一平底锅中火每面约 6–8 分钟，最厚处中心达到 74℃。',
  shrimp:'把蔬菜盛出；虾仁用同一平底锅中火翻炒约 3–5 分钟，中心达到 63℃。',
  chickpea:'把熟鹰嘴豆加入炒好的蔬菜中，翻炒约 2–3 分钟至热透。',
  whitebean:'把熟白芸豆加入炒好的蔬菜中，翻炒约 2–3 分钟至热透。'
 };
 const sauce=flavor.id==='yogurt'?'酸奶蒜香酱保持冷藏，装盘后再淋，不与生肉接触。':`${flavor.note||flavor.name} 在关火后拌入；鲜香草和柠檬汁后加更合适。`;
 const extra=extras.length?`最后加入${extras.map(i=>i.name).join('、')}。`:'';
 const finish=grain.id==='pasta'?'将意面、蔬菜和蛋白质回锅，按需要加少量预留面汤拌匀。':'把主食、蔬菜和蛋白质装盘。';
 const steps=[prep,grainSteps[grain.id],vegStep,proteinSteps[p.id],`${finish}${sauce}${extra} 即可食用。`];
 const steam=p.id==='chicken'?'鸡腿肉 100℃ 蒸约 18–25 分钟，中心 74℃；蔬菜另蒸 6–10 分钟。':p.id==='salmon'?'鱼 100℃ 蒸约 8–12 分钟，中心 63℃；蔬菜另蒸 6–10 分钟。':p.id==='shrimp'?'虾仁 100℃ 蒸约 5–8 分钟，中心 63℃；蔬菜另蒸 6–10 分钟。':'熟豆类与蔬菜 100℃ 蒸约 6–10 分钟，至热透。';
 const airFryer=`蔬菜拌入 ${oilGrams} g 橄榄油，空气炸锅 180℃ 约 10–15 分钟，中途翻动；蔬菜多时分批。${p.id==='chicken'?'鸡腿肉另以 180℃ 约 16–22 分钟，中途翻面，中心 74℃。':p.id==='salmon'?'三文鱼另以 180℃ 约 10–14 分钟，中心 63℃。':p.id==='shrimp'?'虾仁另以 180℃ 约 6–9 分钟，中心 63℃。':'熟豆类在蔬菜出锅后拌入并加热至热透。'}主食仍按上方锅煮步骤准备。`;
 const microwave=p.id==='chicken'||p.id==='salmon'||p.id==='shrimp'?'微波炉更适合加热蔬菜和已煮熟主食：加盖留缝，以约 800 W 加热 2–4 分钟，中途翻拌；生鲜鱼禽和虾建议按锅、蒸箱或空气炸锅方案烹调并测中心温度。加热后拌入本餐橄榄油。':'熟豆类、蔬菜和已煮熟主食加盖留缝，以约 800 W 加热 2–4 分钟，中途翻拌，静置 1 分钟并确认热透；加热后拌入本餐橄榄油。';
 const safety=p.id==='chicken'?'鸡肉中心须达到 74℃，用食物温度计测最厚处；生熟器具分开。':p.id==='salmon'||p.id==='shrimp'?'鱼或虾中心达到 63℃，用食物温度计确认；生熟器具分开。':'若从干鹰嘴豆或干芸豆开始，先按包装浸泡，换水后彻底煮熟；此处克数按熟豆计，不能把浸泡当作煮熟。';
 return {steps,steam,airFryer,microwave,safety,time:p.id==='chicken'?'约 35–45 分钟':grain.id==='rice'?'约 45–55 分钟':'约 25–35 分钟',servings};
}
