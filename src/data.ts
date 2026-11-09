export type Group = 'veg' | 'protein' | 'grain' | 'flavor' | 'extra';
export type Nutrients = { kcal:number; protein:number; fat:number; carbs:number; fiber:number; sodium:number };
export type Ingredient = { id:string; name:string; group:Group; grams:number; nutrients:Nutrients; note?:string };
// 每 100 g 食材的教学用近似值。非逐条数据库核验；见 README 的口径说明。
export const ingredients:Ingredient[] = [
  {id:'broccoli',name:'西兰花',group:'veg',grams:100,nutrients:{kcal:34,protein:2.8,fat:.4,carbs:6.6,fiber:2.6,sodium:33}},
  {id:'zucchini',name:'西葫芦',group:'veg',grams:120,nutrients:{kcal:17,protein:1.2,fat:.3,carbs:3.1,fiber:1,sodium:8}},
  {id:'eggplant',name:'茄子',group:'veg',grams:120,nutrients:{kcal:25,protein:1,fat:.2,carbs:5.9,fiber:3,sodium:2}},
  {id:'tomato',name:'圣女果',group:'veg',grams:100,nutrients:{kcal:18,protein:.9,fat:.2,carbs:3.9,fiber:1.2,sodium:5}},
  {id:'pepper',name:'彩椒',group:'veg',grams:100,nutrients:{kcal:26,protein:1,fat:.3,carbs:6,fiber:2.1,sodium:4}},
  {id:'mushroom',name:'蘑菇',group:'veg',grams:100,nutrients:{kcal:22,protein:3.1,fat:.3,carbs:3.3,fiber:1,sodium:5}},
  {id:'redonion',name:'红洋葱',group:'veg',grams:60,nutrients:{kcal:40,protein:1.1,fat:.1,carbs:9.3,fiber:1.7,sodium:4}},
  {id:'salmon',name:'三文鱼',group:'protein',grams:130,nutrients:{kcal:208,protein:20,fat:13,carbs:0,fiber:0,sodium:59}},
  {id:'chicken',name:'去骨鸡腿肉',group:'protein',grams:140,nutrients:{kcal:143,protein:18,fat:8,carbs:0,fiber:0,sodium:76}},
  {id:'chickpea',name:'熟鹰嘴豆',group:'protein',grams:140,nutrients:{kcal:164,protein:8.9,fat:2.6,carbs:27.4,fiber:7.6,sodium:7}},
  {id:'whitebean',name:'熟白芸豆',group:'protein',grams:140,nutrients:{kcal:110,protein:7.7,fat:.4,carbs:19.5,fiber:6.3,sodium:4}},
  {id:'shrimp',name:'虾仁',group:'protein',grams:140,nutrients:{kcal:99,protein:24,fat:.3,carbs:.2,fiber:0,sodium:111}},
  {id:'pasta',name:'全麦意面（干）',group:'grain',grams:70,nutrients:{kcal:350,protein:13,fat:2.5,carbs:70,fiber:9,sodium:5}},
  {id:'rice',name:'糙米（干）',group:'grain',grams:65,nutrients:{kcal:370,protein:7.5,fat:2.7,carbs:77,fiber:3.5,sodium:7}},
  {id:'bread',name:'全麦面包',group:'grain',grams:70,nutrients:{kcal:247,protein:13,fat:4.2,carbs:41,fiber:7,sodium:450}},
  {id:'couscous',name:'库斯库斯（干）',group:'grain',grams:70,nutrients:{kcal:376,protein:12.8,fat:.6,carbs:77.4,fiber:5,sodium:10}},
  {id:'oats',name:'燕麦片（干）',group:'grain',grams:60,nutrients:{kcal:389,protein:16.9,fat:6.9,carbs:66.3,fiber:10.6,sodium:2}},
  {id:'bulgur',name:'布格麦（干）',group:'grain',grams:70,nutrients:{kcal:342,protein:12.3,fat:1.3,carbs:75.9,fiber:18.3,sodium:17}},
  {id:'quinoa',name:'藜麦（干）',group:'grain',grams:65,nutrients:{kcal:368,protein:14.1,fat:6.1,carbs:64.2,fiber:7,sodium:5}},
  {id:'lemon',name:'柠檬欧芹',group:'flavor',grams:25,nutrients:{kcal:36,protein:1.4,fat:.3,carbs:8,fiber:2,sodium:5},note:'柠檬汁 20 g、欧芹 5 g'},
  {id:'basil',name:'蒜香罗勒',group:'flavor',grams:15,nutrients:{kcal:46,protein:2.3,fat:.5,carbs:8,fiber:2.1,sodium:17},note:'蒜 10 g、罗勒 5 g'},
  {id:'rosemary',name:'迷迭香黑胡椒',group:'flavor',grams:5,nutrients:{kcal:110,protein:3,fat:5,carbs:18,fiber:8,sodium:10},note:'迷迭香 3 g、黑胡椒 2 g'},
  {id:'yogurt',name:'酸奶蒜香酱',group:'flavor',grams:60,nutrients:{kcal:67,protein:4.2,fat:3.3,carbs:5,fiber:0,sodium:46},note:'原味无糖酸奶 50 g、蒜 10 g'},
  {id:'olives',name:'橄榄',group:'extra',grams:25,nutrients:{kcal:115,protein:.8,fat:10.7,carbs:6.3,fiber:3.2,sodium:735}},
  {id:'feta',name:'菲达奶酪',group:'extra',grams:30,nutrients:{kcal:265,protein:14,fat:21,carbs:4,fiber:0,sodium:917}},
  {id:'walnut',name:'核桃',group:'extra',grams:20,nutrients:{kcal:654,protein:15,fat:65,carbs:14,fiber:6.7,sodium:2}}
];
export const baseOil:Ingredient={id:'olive',name:'橄榄油',group:'extra',grams:10,nutrients:{kcal:884,protein:0,fat:100,carbs:0,fiber:0,sodium:0}};
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
