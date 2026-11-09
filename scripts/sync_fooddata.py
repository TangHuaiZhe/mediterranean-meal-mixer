import argparse,json
from pathlib import Path
import ijson
parser=argparse.ArgumentParser(description='从美国农业部下载的 JSON 数据生成离线食材快照')
parser.add_argument('--sr',type=Path,required=True,help='SR Legacy 2018-04 JSON 文件')
parser.add_argument('--foundation',type=Path,required=True,help='Foundation Foods 2026-10-29 JSON 文件')
parser.add_argument('--output',type=Path,default=Path('src/fooddata.ts'))
args=parser.parse_args()
records=[
 ('broccoli',747447,'西兰花'),('zucchini',169291,'西葫芦'),('eggplant',169228,'茄子'),('tomato',321360,'葡萄番茄'),('pepper',170108,'红甜椒'),('mushroom',169251,'白蘑菇'),('redonion',790577,'红洋葱'),('salmon',175167,'大西洋养殖三文鱼'),('chicken',2646171,'去骨去皮鸡腿肉'),('chickpea',173757,'熟鹰嘴豆'),('whitebean',175203,'熟白豆'),('shrimp',175179,'生虾'),('pasta',169738,'全麦意面'),('rice',169703,'长粒糙米'),('bread',172688,'全麦面包'),('couscous',169699,'库斯库斯'),('oats',173904,'普通即食燕麦片'),('bulgur',170688,'布格麦'),('quinoa',168874,'藜麦'),('lemonjuice',167747,'柠檬汁'),('parsley',170416,'欧芹'),('garlic',169230,'大蒜'),('basil',172232,'罗勒'),('rosemary',173473,'迷迭香'),('blackpepper',170931,'黑胡椒'),('plainyogurt',171284,'原味全脂酸奶'),('olives',169094,'罐装熟黑橄榄'),('feta',173420,'菲达奶酪'),('walnut',170187,'核桃'),('oliveoil',171413,'橄榄油')]
needed={id for _,id,_ in records}
sr={}
with args.sr.open('rb') as f:
 for food in ijson.items(f,'SRLegacyFoods.item'):
  if food['fdcId'] in needed:sr[food['fdcId']]=food
foundation={x['fdcId']:x for x in json.load(args.foundation.open())['FoundationFoods'] if x['fdcId'] in needed}
output=[]
for key,id,cn in records:
 if id in foundation:
  food=foundation[id];nutrients={x['nutrient']['id']:float(x['amount']) for x in food['foodNutrients'] if x.get('amount') is not None}
  e=1008 if 1008 in nutrients else 2047
  values=dict(kcal=nutrients.get(e),protein=nutrients.get(1003),fat=nutrients.get(1004),carbs=nutrients.get(1005),fiber=nutrients.get(1079),sodium=nutrients.get(1093))
  source='Foundation Foods';release='2026-10-29'
 else:
  food=sr[id];nutrients={x['nutrient']['id']:float(x['amount']) for x in food['foodNutrients'] if x.get('amount') is not None}
  e=1008
  values=dict(kcal=nutrients.get(e),protein=nutrients.get(1003),fat=nutrients.get(1004),carbs=nutrients.get(1005),fiber=nutrients.get(1079),sodium=nutrients.get(1093))
  source='SR Legacy';release='2018-04'
 missing=[k for k,v in values.items() if v is None]
 if missing and missing!=['fiber'] and missing!=[]:raise ValueError((key,missing))
 if 'fiber' in missing:values['fiber']=0.0
 if 'fiber' not in values:
  if key not in ('shrimp',):raise ValueError((key,values))
  values['fiber']=0.0;missing=['fiber']
 vals={k:values[k] for k in ('kcal','protein','fat','carbs','fiber','sodium')}
 obj={'fdcId':id,'name':cn,'description':food['description'],'dataType':source,'release':release,'energyNutrientId':e,'nutrients':vals}
 if missing:obj['assumption']='膳食纤维源条目未列出；动物性食材按 0 g 处理。'
 output.append((key,obj))
header='''// 从 USDA FoodData Central 官方下载文件选取；数据文件与映射方法见 README。\n// 所有营养值均为每 100 g，可追溯至 fdcId；运行时无需网络。\nimport type { Nutrients } from './data';\nexport type FoodRecord={fdcId:number;name:string;description:string;dataType:'Foundation Foods'|'SR Legacy';release:string;energyNutrientId:number;nutrients:Nutrients;assumption?:string};\nexport const foodData:Record<string,FoodRecord>={\n'''
body=''.join(f"  {key}: {json.dumps(obj,ensure_ascii=False,separators=(',',':'))},\n" for key,obj in output)
args.output.write_text(header+body+'};\n')
print('generated',len(output))
