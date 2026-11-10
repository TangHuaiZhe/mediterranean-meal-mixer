import { foodData, type Ingredient } from './data';

export type AiRecipeInput = {
  items: Ingredient[];
  servings: number;
  steps: string[];
  safety: string;
};

export type AiRecipeResult = { steps: string[]; totalTokens?: number };

export function makeAiRequest(input: AiRecipeInput) {
  const rounded = (value: number) => Math.round(value * 10) / 10;
  const selected = input.items.map(i => {
    const parts = i.components.length > 1 ? `（由${i.components.map(c => `${foodData[c.key].name} ${rounded(i.grams * input.servings * c.baseGrams / i.components.reduce((sum, part) => sum + part.baseGrams, 0))} g`).join('、')}组成，步骤须写出每一项）` : '';
    return `${i.name} ${i.grams * input.servings} g${parts}`;
  }).join('、');
  return {
    model: 'deepseek-flash',
    thinking: { type: 'disabled' },
    max_tokens: 900,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    stream: false,
    messages: [
      { role: 'system', content: '你是严谨的中文菜谱编辑。只把给定的基础步骤改写得清楚、能照着操作。每一步必须写明食材和动作；保留食材数量、烹调次序、温度、时间及食品安全要求。不能加入清单外的食材、额外油盐或新设备。不要计算或修改营养。只输出 JSON 对象，格式为 {"steps":["步骤一","步骤二"]}。' },
      { role: 'user', content: `用餐人数：${input.servings}。\n所选食材及总重量：${selected}。\n基础步骤：\n${input.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n食品安全提示：${input.safety}\n请将步骤改写得具体，写明每次加入或处理哪些食材，并输出 JSON。` }
    ]
  };
}

export function parseAiSteps(raw: unknown, selectedItems: Ingredient[]): AiRecipeResult {
  if (!raw || typeof raw !== 'object' || !('choices' in raw)) throw new Error('接口没有返回菜谱。');
  const response = raw as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }>; usage?: { total_tokens?: number } };
  const choice = response.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('回答被截断，请使用本地步骤，稍后重试。');
  const content = choice?.message?.content;
  if (!content || content.length > 10000) throw new Error('接口返回的步骤为空或过长。');
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error('接口返回的步骤格式不正确。'); }
  const steps = parsed && typeof parsed === 'object' && 'steps' in parsed ? (parsed as { steps: unknown }).steps : null;
  if (!Array.isArray(steps) || steps.length < 2 || steps.length > 10 || steps.some(s => typeof s !== 'string' || !s.trim() || s.length > 500)) {
    throw new Error('接口返回的步骤数量或内容不合适。');
  }
  const text = steps.join('');
  for (const item of selectedItems) {
    if (item.group === 'veg' && !text.includes(item.name)) throw new Error(`AI 步骤遗漏了${item.name}，已保留本地步骤。`);
    if (item.group === 'protein' && !text.includes(item.name.replace('去骨', '').replace('熟', ''))) throw new Error(`AI 步骤遗漏了${item.name}，已保留本地步骤。`);
    if (item.group === 'grain' && !text.includes(item.name.replace(/（干）|（生）/g, ''))) throw new Error(`AI 步骤遗漏了${item.name}，已保留本地步骤。`);
  }
  for (const item of selectedItems) {
    if (item.group === 'protein' && item.id === 'chicken' && !text.includes('74℃')) throw new Error('AI 步骤遗漏了鸡肉安全温度，已保留本地步骤。');
    if (item.group === 'protein' && item.id === 'salmon' && !text.includes('63℃')) throw new Error('AI 步骤遗漏了鱼的安全温度，已保留本地步骤。');
  }
  const totalTokens = response.usage?.total_tokens;
  return { steps: steps.map(s => s.trim()), totalTokens: typeof totalTokens === 'number' && Number.isFinite(totalTokens) ? totalTokens : undefined };
}

export async function generateAiSteps(key: string, input: AiRecipeInput): Promise<AiRecipeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(makeAiRequest(input)),
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: controller.signal
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('密钥无效。');
      if (response.status === 402) throw new Error('DeepSeek 账户余额不足。');
      if (response.status === 429) throw new Error('请求过于频繁，请稍后再试。');
      throw new Error(`DeepSeek 请求失败（${response.status}）。`);
    }
    return parseAiSteps(await response.json(), input.items);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('请求超时，已保留本地步骤。');
    if (error instanceof TypeError) throw new Error('网络请求失败；请检查联网状态或浏览器跨域限制。');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
