import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
const bundled=await build({entryPoints:['src/engine.ts','src/data.ts'],bundle:true,format:'esm',write:false,outdir:'x'});
const modules={};for(const file of bundled.outputFiles){modules[file.path.endsWith('engine.js')?'engine':'data']=await import('data:text/javascript;base64,'+Buffer.from(file.contents).toString('base64'))}
const {selected,withBase,validate,nutrition,makeRecipe}=modules.engine;const {presets,baseOil}=modules.data;
for(const preset of presets){assert.equal(validate(preset.ids),null,preset.name);const items=selected(preset.ids);assert.equal(items.length,5);const n=nutrition(withBase(items));assert(n.kcal>300&&n.kcal<1000,preset.name);assert(n.protein>10,preset.name);assert(n.fiber>2,preset.name);const r=makeRecipe(items,1);assert.equal(r.steps.length,5);assert(r.steam.includes('100℃'));assert(r.microwave.includes('800 W'));assert(r.airFryer.includes('180℃'));assert(r.steps[2].includes('平底锅'))}
assert.match(validate(['salmon','rice','yogurt','tomato']),/酸奶/);
assert.match(validate(['shrimp','rice','lemon','tomato','feta']),/奶酪/);
assert.match(validate(['salmon','rice','lemon']),/4–8/);
const a=nutrition(withBase(selected(presets[0].ids)));assert(Math.abs(a.kcal-683)<1,'salmon preset energy');
assert(makeRecipe(selected(presets[1].ids),1).safety.includes('74℃'));
assert(makeRecipe(selected(presets[2].ids),1).safety.includes('干鹰嘴豆'));
assert(makeRecipe(selected(presets[0].ids),3).servings===3);
assert.equal(baseOil.grams,10);
assert.equal(withBase(selected(presets[0].ids)).filter(i=>i.id==='olive').length,1);
const fourVeg=['broccoli','zucchini','tomato','redonion','chicken','oats','lemon','walnut'];
assert.equal(validate(fourVeg),null);
assert.match(makeRecipe(selected(fourVeg),1).steps[2],/分批/);
assert.match(makeRecipe(selected(fourVeg),1).steps[1],/燕麦/);
assert.match(validate(['broccoli','zucchini','tomato','redonion','pepper','chicken','oats','lemon']),/4–8|1–4/);
assert.match(makeRecipe(selected(['tomato','shrimp','pasta','basil']),1).steps[4],/回锅/);
const html=await readFile('dist/地中海料理搭配器.html','utf8');
assert(html.includes('<style>')&&html.includes('<script>'));
assert(!/<script[^>]+src=|<link[^>]+stylesheet/i.test(html),'no remote/runtime dependencies');
assert(html.includes('plate-art'));
console.log(`通过：${presets.length} 个预设、组合限制、营养计算、设备指引、安全提示与单文件检查。`);
