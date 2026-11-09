# 地中海料理搭配器

双击 `dist/地中海料理搭配器.html` 即可离线使用，不需要本地服务器。源码在 `src/`，执行 `npm install && npm run build` 可重新生成单文件页面。`npm run typecheck` 检查 TypeScript。

## 数据口径

- `src/data.ts` 的食材数值为每 100 g 的人工取整近似值，参考美国农业部 [FoodData Central](https://fdc.nal.usda.gov/) 的常见食材类别，但**未逐项绑定或核验具体 FDC 条目**。因而界面显示「约值」，不能作为有可追溯批次的营养事实。后续应替换为带 FDC 编号、食材状态、版本、来源日期的数据。
- 食材按界面列出的生重、干重、熟重或成品重量计算：每项营养 = 每 100 g 数值 × 选定克数 ÷ 100，再相加。蔬菜、鱼禽按生重；豆类按煮熟沥干重；意面、糙米、库斯库斯、燕麦、布格麦、藜麦按干重；面包、奶酪等按成品重。烹调损耗、吸水、沥油、额外调味盐和未选中的油不计；默认每人 10 g 橄榄油计入所有营养与购物清单。
- 每人份的营养不随用餐人数改变；购物清单和食材总重会随人数倍增。热量独立使用表中近似值，不从三大营养素反推。
- 成人默认每日参考值来自美国食品药品监督管理局的 [Daily Value（每日参考值）](https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels)：蛋白质 50 g、脂肪 78 g、碳水 275 g、纤维 28 g、钠 2300 mg；热量 2000 kcal 是常用示例基准。均可在界面修改。百分比 = 每份估算量 ÷ 用户设定参考值 × 100%。
- 鱼类及虾以中心 63℃、禽肉以中心 74℃ 为完成判断，参照 [FoodSafety.gov](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。设备的时间仅是起点。干豆类先浸泡，换水彻底煮熟；参照 [爱尔兰食品安全局](https://www.fsai.ie/consumer-advice/food-safety-and-hygiene/advice-on-eating-legumes)。
- 本工具仅供一般饮食规划，不替代个体医疗建议。

## 结构

`data.ts` 管食材与预设；`engine.ts` 管组合规则、营养计算和菜谱生成；`main.ts` 管页面与本机收藏。收藏只在浏览器允许 `file://` 本地存储时保存；拒绝时给出提示，页面仍可使用。图片为内嵌自制 SVG 餐盘示意，不对应特定成品照片，也不请求网络。

## 搭配规则

每餐选 1–4 种蔬菜、1 种蛋白质、1 种主食、1 种风味，可选 1 种配料，共 4–8 种自选元素。橄榄油固定为每人 10 g 基础用油，不占自选数量，营养和购物清单会计入。燕麦为咸口燕麦片做法；多种蔬菜时建议分批烹调。

## 发布

`npm run build` 同时生成 `dist/地中海料理搭配器.html` 和 `docs/index.html`。GitHub Pages 从 `main` 分支的 `/docs` 目录发布；`docs/.nojekyll` 使静态文件直接送出。请在提交前运行 `npm run typecheck && npm test && npm run build`，并把更新后的 `docs/index.html` 一起提交。
