# 地中海料理搭配器

[在线打开](https://tanghuaizhe.github.io/mediterranean-meal-mixer/)；或双击 `dist/地中海料理搭配器.html` 离线使用。源码在 `src/`，`npm ci && npm run build` 可生成单文件页面；`npm run typecheck && npm test` 执行检查。

## 数据来源与口径

营养数据逐项选自美国农业部 [FoodData Central（食品营养数据库）官方下载数据](https://fdc.nal.usda.gov/download-datasets/)：`Foundation Foods`（基础食物数据）2026-10-29 与 `SR Legacy`（传统参考数据）2018-04。选取结果静态保存在 `src/fooddata.ts`，包含食品编号、原始英文描述、数据集和发布日期、每 100 g 六项营养值。网页运行时不请求接口或使用密钥。用户可点击菜谱底部的编号在官方站点按编号检索对应条目。`src/data.ts` 负责中文食材与来源条目的映射。

- 使用食品编号 1008 的能量值（千卡）；若基础食物条目不含该项，则使用编号 2047 的一般换算能量。蛋白质、脂肪、碳水、纤维、钠分别使用营养项目 1003、1004、1005、1079、1093。`fooddata.ts` 明确记录能量编号。
- 预设克数及编辑后的克数均指**每人份可食部分**。蔬菜与鱼禽按生重，豆类按无盐水煮熟重，意面、糙米、库斯库斯、燕麦、布格麦、藜麦按干重；面包、奶酪、橄榄按成品重。每项营养 = 来源每 100 g 数值 × 每人克数 ÷ 100；复合风味按所列组成食材的默认比例缩放后求和。购物清单再乘用餐人数。默认橄榄油每人 10 g，可在食材清单中调整。
- 圣女果以葡萄番茄、彩椒以红甜椒、蘑菇以白蘑菇、白芸豆以普通白豆近似映射。品牌、品种、沥水程度及烹调损耗会造成差异；用户界面标明这些映射。生虾来源未列膳食纤维，去骨去皮生鸡腿肉来源也未列膳食纤维，按动物性食材 0 g 处理并标注假设。营养数字是**食材计算值，不是成品检测值**。
- 成人默认每日参考值采用美国食品药品监督管理局的 [Daily Value（每日参考值）](https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels)：蛋白质 50 g、脂肪 78 g、碳水 275 g、纤维 28 g、钠 2300 mg；热量 2000 kcal 是一般示例。均可在界面修改。百分比 = 每份计算量 ÷ 设定参考值 × 100%。不提供个人医疗或临床营养建议。
- 鱼中心 63℃、禽肉中心 74℃、虾仁煮至珍珠白且不透明的食安提醒参照 [FoodSafety.gov（美国食品安全网）](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)。干豆类须先浸泡并彻底煮熟，参照 [爱尔兰食品安全局](https://www.fsai.ie/consumer-advice/food-safety-and-hygiene/advice-on-eating-legumes)。设备时间只是起点，应以中心温度和熟透程度为准。


### 重新生成来源快照

从官方下载页取得 `FoodData_Central_sr_legacy_food_json_2018-04.zip` 和 `FoodData_Central_foundation_food_json_2026-10-29.zip`，解压后运行：

```sh
python3 -m pip install ijson
python3 scripts/sync_fooddata.py --sr /path/to/FoodData_Central_sr_legacy_food_json_2018-04.json --foundation /path/to/FoodData_Central_foundation_food_json_2026-10-29.json
```

此次下载的压缩包 SHA-256 分别为 `0fe8ae486a2c8eb42cb96413f058deb51863a46c8fb8eeb4b1fb45006dd338ef`（传统参考数据）与 `dd414cc9f1a132626bad354ef6655972c78b44aff14f16114dc899708663c579`（基础食物数据）。原始大文件不纳入仓库；生成脚本会校验所需营养项目，并显式标记两项动物性食材的纤维归零假设。

## 操作与结构

每餐至少选 1 种蔬菜，蛋白质、主食、风味和配料均可不选，也各最多选 1 种。蔬菜不设数量上限，纯烤蔬菜会生成独立配菜菜谱，多种蔬菜会优先生成烤箱菜谱。鸡蛋已列入蛋白质选项。橄榄油是基础用油，不占自选数量。点击菜谱食材清单中的数字可编辑每人克数；总量、营养、复合风味配比、橄榄油用量和购物清单同步更新。克数限制由 `engine.ts` 定义，防止误输入。收藏会保存组合及克数；旧版仅含食材编号的收藏会按默认克数迁移。本地存储不可用时页面仍可使用。

`data.ts` 管食材映射和预设，`fooddata.ts` 管来源记录，`engine.ts` 管组合、克数、营养和菜谱规则，`main.ts` 管界面。插图为内嵌餐盘示意，不对应实际照片。

## 发布

在线页面在 `<head>` 中按用户提供的项目编号 `zawq522qjf` 加载 Microsoft Clarity（网站使用分析）。仅当页面位于本仓库的 GitHub Pages 地址时才加载；双击打开的 `file://` 离线文件不会请求 Clarity，菜谱功能也不依赖它。页面底部说明了在线统计。


`npm run build` 同时生成 `dist/地中海料理搭配器.html` 和 `docs/index.html`。GitHub Pages（GitHub 静态网站托管）从 `main` 分支的 `/docs` 发布。提交前执行 `npm run typecheck && npm test && npm run build`，并把 `docs/index.html` 一起提交。
