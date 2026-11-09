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

每餐至少选 1 种蔬菜，蛋白质、主食、风味和配料均可不选，也各最多选 1 种。蔬菜不设数量上限，纯烤蔬菜会生成独立配菜菜谱，多种蔬菜会优先生成烤箱菜谱。鸡蛋已列入蛋白质选项。橄榄油是基础用油，不占自选数量。点击菜谱食材清单中的数字可编辑每人克数；总量、营养、复合风味配比、橄榄油用量和购物清单同步更新。克数限制由 `engine.ts` 定义，防止误输入。收藏会保存组合及克数；旧版仅含食材编号的收藏会按默认克数迁移。本地存储不可用时页面仍可使用。登录后收藏按账户同步；离线单文件继续使用本机收藏。

`data.ts` 管食材映射和预设，`fooddata.ts` 管来源记录，`engine.ts` 管组合、克数、营养和菜谱规则，`favorites.ts` 管收藏格式，`favorite-sync.ts` 管本机队列及云端同步，`cloud.ts` 管身份验证与数据库调用，`main.ts` 管界面。插图为内嵌餐盘示意，不对应实际照片。

烹调步骤会写出实际所选蔬菜及总克数，并按需要先焯西兰花、分段炒制或分段入烤箱。设备时间仍是参考值；用户应以实际熟度和食安提示为准。

## 可选的 DeepSeek 辅助步骤

普通网页保留不联网也能运行的本地步骤。点击“打开 AI 菜谱页”进入 `docs/ai.html`，也可在双击打开的离线单文件里使用 AI 选项（此时需联网）。手动点击 AI 按钮时，浏览器会把所选食材、克数、本地步骤与食安提示发给 DeepSeek。AI 只负责将当前做法写得更清楚，营养计算和食品安全提示仍由本地规则提供；接口回答会经过基本格式与食材遗漏检查，失败时显示本地步骤。

GitHub Pages 是公开静态网站，**不能安全保存私人 DeepSeek 密钥**。本项目没有把密钥写入源码、HTML、部署设置或 GitHub Pages；不会让访客共同消耗站长的额度。使用者在独立的 `ai.html` 页面临时输入**自己的**密钥，浏览器直接请求 DeepSeek；密钥不进入网址、收藏或本地存储，提交后输入框立即清空。该页面不加载 Microsoft Clarity（网站使用分析）脚本。浏览器和扩展仍可看到自身发出的请求，故不应把此方式当作服务器端保密。

模型使用 `deepseek-flash`，关闭思考模式，每次最多输出 900 个 token。按钮需手动点击；每页最多调用 3 次，但刷新即可重置，**这不是账户级预算控制**。若要让大众免费使用、同时由站长付费，需增加有身份验证、服务端保存密钥并设置真实速率和预算限制的后端；单靠 GitHub Pages 做不到。浏览器跨域许可取决于 DeepSeek 接口当前配置，若发生变化，AI 请求会报错，本地步骤仍可用。不要把真实密钥提交进仓库或贴在聊天中。

## 登录与收藏同步

项目已连接 Supabase，公开项目配置位于 `supabase.public.json`。这里的发布密钥本来就会出现在网页中；服务端密钥绝不能写入此文件。已在项目中执行收藏表迁移，并确认匿名请求没有读表权限。要在新项目复现：

1. 在 [Supabase](https://supabase.com/dashboard) 创建项目。项目应启用邮箱登录，在 Auth → URL Configuration 中把 Site URL 设为 `https://tanghuaizhe.github.io/mediterranean-meal-mixer/`，并将该地址加入 Redirect URLs。邮件链接会返回这个页面。首次用邮箱登录会创建账户。
2. 在项目 SQL Editor 中执行 `supabase/migrations/202611090001_recipe_favorites.sql`。表开启行级安全策略：已登录用户仅能读、加、删自己的收藏。不要关闭 RLS。
3. 从项目设置获取 Project URL 和 **publishable key（公开发布密钥，`sb_publishable_` 开头）**，写入 `supabase.public.json`；也可用 `.env.example` 所示的 `PUBLIC_SUPABASE_URL` 和 `PUBLIC_SUPABASE_PUBLISHABLE_KEY` 环境变量覆盖。运行 `npm run typecheck && npm test && npm run build`，构建会把这两个公开值内嵌到静态 HTML。绝不要使用 `sb_secret_`、`service_role` 或 DeepSeek 密钥。提交更新后的 `docs/` 到发布分支。
4. 用两个账户验证：各自添加、删除、重新登录并刷新；确认彼此看不到对方收藏。再断网添加一条收藏，恢复网络后按“同步收藏”确认上传。当前已用一个真实账户验证邮箱登录、刷新后会话恢复，以及两条收藏写入云端数据表；跨设备、双账户隔离与真实断网恢复仍待实测。匿名读表请求已确认返回 401。

登录使用邮箱链接；认证会话由 Supabase 浏览器客户端保存。未登录时收藏保存在当前浏览器；首次登录会把这些收藏迁移到当前账户，随后清除匿名收藏，避免下次登录重复导入。离线 `file://` 页面不连接 Supabase，仍可本机收藏。DeepSeek 密钥不随账户保存或同步。

## 发布

在线页面在 `<head>` 中按用户提供的项目编号 `zawq522qjf` 加载 Microsoft Clarity（网站使用分析）。仅当页面位于本仓库的 GitHub Pages 地址时才加载；双击打开的 `file://` 离线文件不会请求 Clarity，菜谱功能也不依赖它。页面底部说明了在线统计。


`npm run build` 同时生成 `dist/地中海料理搭配器.html` 和 `docs/index.html`。GitHub Pages（GitHub 静态网站托管）从 `main` 分支的 `/docs` 发布。提交前执行 `npm run typecheck && npm test && npm run build`，并把 `docs/index.html` 一起提交。
