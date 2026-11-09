import { foodData } from './fooddata';
export type Group = 'veg' | 'protein' | 'grain' | 'flavor' | 'extra';
export type Nutrients = { kcal:number; protein:number; fat:number; carbs:number; fiber:number; sodium:number };
export type Component = { key:string; baseGrams:number };
export type Ingredient = { id:string; name:string; group:Group; grams:number; nutrients:Nutrients; components:Component[]; sourceNote?:string };
const keys:(keyof Nutrients)[]=['kcal','protein','fat','carbs','fiber','sodium'];
function make(id:string,name:string,group:Group,components:Component[],sourceNote?:string):Ingredient{
 const grams=components.reduce((sum,c)=>sum+c.baseGrams,0);
 const nutrients={} as Nutrients;
 for(const key of keys)nutrients[key]=components.reduce((sum,c)=>sum+foodData[c.key].nutrients[key]*c.baseGrams/grams,0);
 return {id,name,group,grams,nutrients,components,sourceNote};
}
function one(id:string,name:string,group:Group,grams:number,sourceKey=id,sourceNote?:string):Ingredient{return make(id,name,group,[{key:sourceKey,baseGrams:grams}],sourceNote)}
export const ingredients:Ingredient[] = [
 one('broccoli','西兰花','veg',100),one('zucchini','西葫芦','veg',120),one('eggplant','茄子','veg',120),
 one('tomato','圣女果','veg',100,'tomato','采用葡萄番茄近似映射，品种可能不同。'),
 one('pepper','彩椒','veg',100,'pepper','采用红甜椒近似映射，其他颜色可能不同。'),
 one('mushroom','蘑菇','veg',100,'mushroom','采用白蘑菇近似映射，其他品种可能不同。'),
 one('redonion','红洋葱','veg',60),one('salmon','三文鱼','protein',130,'salmon','采用大西洋养殖三文鱼；野生及其他品种可能不同。'),
 one('chicken','去骨鸡腿肉','protein',140),one('chickpea','熟鹰嘴豆','protein',140),
 one('whitebean','熟白芸豆','protein',140,'whitebean','采用无盐水煮白豆近似映射；具体芸豆品种可能不同。'),
 one('shrimp','虾仁','protein',140,'shrimp','采用生虾数据；已去壳可食部分按生重计。'),
 one('pasta','全麦意面（干）','grain',70),one('rice','糙米（干）','grain',65,'rice','采用长粒糙米；其他品种可能不同。'),
 one('bread','全麦面包','grain',70,'bread','不同品牌配方及钠含量可能差异较大。'),
 one('couscous','库斯库斯（干）','grain',70),one('oats','燕麦片（干）','grain',60),
 one('bulgur','布格麦（干）','grain',70),one('quinoa','藜麦（干）','grain',65),
 make('lemon','柠檬欧芹','flavor',[{key:'lemonjuice',baseGrams:20},{key:'parsley',baseGrams:5}]),
 make('basil','蒜香罗勒','flavor',[{key:'garlic',baseGrams:10},{key:'basil',baseGrams:5}]),
 make('rosemary','迷迭香黑胡椒','flavor',[{key:'rosemary',baseGrams:3},{key:'blackpepper',baseGrams:2}]),
 make('yogurt','酸奶蒜香酱','flavor',[{key:'plainyogurt',baseGrams:50},{key:'garlic',baseGrams:10}], '采用原味全脂酸奶；其他脂肪含量或品牌可能不同。'),
 one('olives','橄榄','extra',25,'olives','采用罐装熟黑橄榄；盐渍方式可能显著影响钠含量。'),
 one('feta','菲达奶酪','extra',30),one('walnut','核桃','extra',20)
];
export const baseOil=one('olive','橄榄油','extra',10,'oliveoil');
export const groups:{id:Group;label:string;hint:string}[]=[
 {id:'veg',label:'蔬菜',hint:'选 1–4 种'}, {id:'protein',label:'蛋白质',hint:'选 1 种'},
 {id:'grain',label:'主食',hint:'选 1 种'}, {id:'flavor',label:'风味',hint:'选 1 种'},
 {id:'extra',label:'可选配料',hint:'可选 0–1 种'}
];
export type Preset={name:string;ids:string[];description:string};
export const presets:Preset[]=[
 {name:'柠檬香草烤三文鱼',ids:['broccoli','tomato','salmon','couscous','lemon'],description:'鱼与蔬菜同盘，酸香清爽'},
 {name:'希腊风味鸡腿糙米碗',ids:['zucchini','pepper','chicken','rice','yogurt'],description:'烤鸡配谷物与冷酱'},
 {name:'西西里鹰嘴豆意面',ids:['eggplant','tomato','chickpea','pasta','basil'],description:'豆类与全谷的植物餐'},
 {name:'蒜香虾仁库斯库斯',ids:['zucchini','tomato','shrimp','couscous','basil'],description:'快手海鲜主餐'},
 {name:'白芸豆烤蔬菜面包盘',ids:['pepper','mushroom','whitebean','bread','rosemary'],description:'暖蔬菜与豆类的轻食'},
 {name:'红洋葱香草燕麦碗',ids:['redonion','tomato','chickpea','oats','lemon'],description:'咸口燕麦与熟鹰嘴豆'}
];
export const defaultTargets:Nutrients={kcal:2000,protein:50,fat:78,carbs:275,fiber:28,sodium:2300};
export {foodData};
