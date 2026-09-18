import type { Recipe } from '../../domain/types';
import { fryingOil, ing, opt, recipe, toTaste } from './helpers';

export const CHINESE_RECIPES: Recipe[] = [
  recipe({
    id: 'mapo-tofu',
    name: { ja: '麻婆豆腐', en: 'Mapo tofu' },
    description: { ja: 'ピリ辛のひき肉あんで豆腐を煮る中華の定番。', en: 'Tofu in a spicy, savory ground pork sauce.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 20,
    ingredients: [
      ing('tofu', 300, 'g'), ing('ground-pork', 150, 'g'), ing('doubanjiang', 1, 'tbsp'), opt('tianmianjiang', 1, 'tbsp'), ing('garlic', 1, 'clove'),
      ing('ginger', 1, 'pcs'), ing('soy-sauce', 1, 'tbsp'), ing('chicken-stock-powder', 1, 'tsp'), ing('potato-starch', 1, 'tbsp'), ing('sesame-oil', 1, 'tsp'), toTaste('scallion'),
    ],
    steps: {
      ja: [
        '豆腐は2cm角に切って熱湯でさっとゆでる。にんにく・しょうがはみじん切りにする。',
        'フライパンにごま油を熱し、にんにく・しょうが・豆板醤を炒め、ひき肉を加えてほぐしながら炒める。',
        '甜麺醤・しょうゆ・鶏ガラスープの素・水200mlを加えて煮立て、豆腐を入れて3分煮る。',
        '水溶き片栗粉（片栗粉と水大さじ2）でとろみをつけ、小ねぎを散らす。',
      ],
      en: [
        'Cut the tofu into 2 cm cubes and blanch briefly. Mince the garlic and ginger.',
        'Heat the sesame oil, fry the garlic, ginger and doubanjiang, then add the pork and break it up.',
        'Add the tianmianjiang, soy sauce, stock powder and 200 ml water; bring to a boil, add the tofu and simmer 3 minutes.',
        'Thicken with the potato starch dissolved in 2 tablespoons of water and scatter with scallion.',
      ],
    },
  }),
  recipe({
    id: 'gyoza',
    name: { ja: '餃子', en: 'Gyoza' },
    description: { ja: 'キャベツとニラたっぷりの手作り焼き餃子。', en: 'Pan-fried dumplings filled with pork, cabbage and garlic chives.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 40,
    ingredients: [
      ing('gyoza-wrappers', 24, 'sheet'), ing('ground-pork', 200, 'g'), ing('cabbage', 150, 'g'), ing('garlic-chives', 0.5, 'bunch'), ing('garlic', 1, 'clove'),
      ing('ginger', 1, 'pcs'), ing('soy-sauce', 1, 'tbsp'), ing('sesame-oil', 1, 'tbsp'), toTaste('salt'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        'キャベツはみじん切りにして塩をふり、水気を絞る。ニラは小口切り、にんにく・しょうがはみじん切りにする。',
        'ひき肉に野菜・しょうゆ・ごま油・塩を加えて粘りが出るまで混ぜる。',
        '皮にあんをのせ、縁に水をつけてひだを作りながら包む。',
        'フライパンに油を熱して餃子を並べ、焼き色がついたら水100mlを注いで蓋をし、水気がなくなるまで蒸し焼きにする。',
      ],
      en: [
        'Mince the cabbage, salt it and squeeze dry. Finely chop the garlic chives, garlic and ginger.',
        'Mix the pork with the vegetables, soy sauce, sesame oil and salt until sticky.',
        'Place filling on each wrapper, wet the edge and pleat to seal.',
        'Heat the oil, arrange the gyoza, brown the bottoms, add 100 ml water, cover and steam until the water is gone.',
      ],
    },
  }),
  recipe({
    id: 'fried-rice',
    name: { ja: 'チャーハン', en: 'Fried rice' },
    description: { ja: '卵とねぎだけで作るパラパラの基本チャーハン。', en: 'Simple egg and scallion fried rice.' },
    cuisine: 'chinese',
    category: 'rice',
    timeMinutes: 15,
    ingredients: [ing('rice', 300, 'g'), ing('egg', 2, 'pcs'), toTaste('scallion'), ing('ham', 2, 'slice'), ing('soy-sauce', 1, 'tbsp'), toTaste('salt'), ing('chicken-stock-powder', 1, 'tsp'), ing('cooking-oil', 2, 'tbsp')],
    steps: {
      ja: [
        'ハムは1cm角、小ねぎは小口切りにする。卵は溶いておく。',
        'フライパンに油を強火で熱し、溶き卵を入れてすぐにご飯を加え、ほぐしながら炒める。',
        'ハム・鶏ガラスープの素・塩を加えて炒め、しょうゆを鍋肌から回し入れて小ねぎを混ぜる。',
      ],
      en: [
        'Dice the ham and slice the scallion. Beat the eggs.',
        'Heat the oil over high heat, pour in the egg and immediately add the rice, breaking it up as you stir-fry.',
        'Add the ham, stock powder and salt, drizzle the soy sauce around the edge of the pan and stir in the scallion.',
      ],
    },
  }),
  recipe({
    id: 'hoikoro',
    name: { ja: '回鍋肉', en: 'Twice-cooked pork (hoikoro)' },
    description: { ja: 'キャベツと豚バラを甘辛味噌で炒める。', en: 'Pork belly and cabbage stir-fried in sweet-spicy bean paste.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 20,
    ingredients: [
      ing('pork-belly', 200, 'g'), ing('cabbage', 200, 'g'), ing('bell-pepper', 1, 'pcs'), ing('tianmianjiang', 1.5, 'tbsp'), ing('doubanjiang', 1, 'tsp'),
      ing('soy-sauce', 1, 'tbsp'), ing('sake', 1, 'tbsp'), ing('garlic', 1, 'clove'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        'キャベツとピーマンはざく切り、豚肉は5cm幅に切る。甜麺醤・豆板醤・しょうゆ・酒を混ぜておく。',
        'フライパンに油と薄切りにんにくを熱し、豚肉を炒めて脂を出す。',
        'キャベツとピーマンを加えて強火で炒め、合わせ調味料を加えて全体に絡める。',
      ],
      en: [
        'Roughly chop the cabbage and pepper and cut the pork into 5 cm pieces. Mix the tianmianjiang, doubanjiang, soy sauce and sake.',
        'Heat the oil with sliced garlic and cook the pork until the fat renders.',
        'Add the cabbage and pepper, stir-fry over high heat, then add the sauce and toss to coat.',
      ],
    },
  }),
  recipe({
    id: 'chinjao-rosu',
    name: { ja: '青椒肉絲', en: 'Pepper steak (chinjao rosu)' },
    description: { ja: '細切りの牛肉とピーマンをオイスターソースで炒める。', en: 'Shredded beef, peppers and bamboo shoot in oyster sauce.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 20,
    ingredients: [
      ing('beef-thin-sliced', 200, 'g'), ing('bell-pepper', 3, 'pcs'), ing('bamboo-shoot', 100, 'g'), ing('oyster-sauce', 1, 'tbsp'), ing('soy-sauce', 1, 'tbsp'),
      ing('sake', 1, 'tbsp'), ing('potato-starch', 1, 'tbsp'), ing('garlic', 1, 'clove'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        '牛肉は細切りにして酒と片栗粉をもみ込む。ピーマンとたけのこは細切りにする。',
        'フライパンに油とみじん切りにんにくを熱し、牛肉を強火で炒める。',
        'ピーマンとたけのこを加えてさっと炒め、オイスターソースとしょうゆを加えて絡める。',
      ],
      en: [
        'Cut the beef into thin strips and rub with the sake and potato starch. Cut the peppers and bamboo shoot into strips.',
        'Heat the oil with minced garlic and stir-fry the beef over high heat.',
        'Add the peppers and bamboo shoot, stir briefly, then add the oyster sauce and soy sauce and toss.',
      ],
    },
  }),
  recipe({
    id: 'ebi-chili',
    name: { ja: 'エビチリ', en: 'Chili shrimp (ebi chili)' },
    description: { ja: 'ぷりぷりのえびを甘辛いチリソースで。', en: 'Plump shrimp in a sweet and spicy chili sauce.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 20,
    ingredients: [
      ing('shrimp', 250, 'g'), ing('ketchup', 3, 'tbsp'), ing('doubanjiang', 1, 'tsp'), ing('garlic', 1, 'clove'), ing('ginger', 1, 'pcs'), toTaste('scallion'),
      ing('sake', 1, 'tbsp'), ing('sugar', 1, 'tsp'), ing('chicken-stock-powder', 1, 'tsp'), ing('potato-starch', 1, 'tbsp'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        'えびは殻と背わたを取り、酒と片栗粉半量をもみ込む。にんにく・しょうが・小ねぎはみじん切りにする。',
        'フライパンに油を熱し、にんにく・しょうが・豆板醤を炒め、えびを加えて色が変わるまで炒める。',
        'ケチャップ・砂糖・鶏ガラスープの素・水100mlを加えて煮立て、残りの片栗粉を水で溶いて加えてとろみをつけ、小ねぎを混ぜる。',
      ],
      en: [
        'Peel and devein the shrimp and rub with the sake and half the potato starch. Mince the garlic, ginger and scallion.',
        'Heat the oil, fry the garlic, ginger and doubanjiang, then add the shrimp and cook until pink.',
        'Add the ketchup, sugar, stock powder and 100 ml water; bring to a boil, thicken with the remaining starch dissolved in water and stir in the scallion.',
      ],
    },
  }),
  recipe({
    id: 'chinese-egg-soup',
    name: { ja: '中華風たまごスープ', en: 'Chinese egg drop soup' },
    description: { ja: 'ふわっと卵が広がる手早いスープ。', en: 'A quick, comforting soup with ribbons of egg.' },
    cuisine: 'chinese',
    category: 'soup',
    timeMinutes: 10,
    ingredients: [ing('egg', 1, 'pcs'), ing('chicken-stock-powder', 2, 'tsp'), ing('soy-sauce', 1, 'tsp'), ing('sesame-oil', 1, 'tsp'), toTaste('scallion', true), opt('wakame', 1, 'tsp'), opt('potato-starch', 1, 'tsp')],
    steps: {
      ja: [
        '鍋に水400ml・鶏ガラスープの素・しょうゆ・乾燥わかめを入れて煮立てる。',
        '水溶き片栗粉を加えて軽くとろみをつけ、溶き卵を細く回し入れる。',
        'ごま油を垂らし、小ねぎを散らす。',
      ],
      en: [
        'Bring 400 ml water, the stock powder, soy sauce and wakame to a boil.',
        'Stir in the potato starch dissolved in water, then drizzle in the beaten egg in a thin stream.',
        'Finish with sesame oil and scallion.',
      ],
    },
  }),
  recipe({
    id: 'bean-sprout-stir-fry',
    name: { ja: 'もやし炒め', en: 'Bean sprout stir-fry' },
    description: { ja: 'シャキシャキ食感を残して強火でさっと炒める。', en: 'Crisp bean sprouts flash-fried over high heat.' },
    cuisine: 'chinese',
    category: 'side',
    timeMinutes: 10,
    ingredients: [
      ing('bean-sprouts', 200, 'g'), opt('garlic-chives', 0.5, 'bunch'), opt('pork-thin-sliced', 80, 'g'), ing('soy-sauce', 1, 'tsp'),
      toTaste('salt'), toTaste('black-pepper'), ing('sesame-oil', 1, 'tbsp'), ing('chicken-stock-powder', 0.5, 'tsp'),
    ],
    steps: {
      ja: [
        'ニラは4cm長さに切る。フライパンにごま油を強火で熱し、豚肉を炒める。',
        'もやしとニラを加えて1分炒め、鶏ガラスープの素・しょうゆ・塩・こしょうで味を調える。',
      ],
      en: [
        'Cut the garlic chives into 4 cm lengths. Heat the sesame oil over high heat and cook the pork.',
        'Add the bean sprouts and chives, stir-fry 1 minute and season with the stock powder, soy sauce, salt and pepper.',
      ],
    },
  }),
  recipe({
    id: 'bang-bang-ji',
    name: { ja: '棒棒鶏', en: 'Bang bang chicken' },
    description: { ja: '蒸し鶏ときゅうりにごまだれをかける冷菜。', en: 'Poached chicken and cucumber with a sesame dressing.' },
    cuisine: 'chinese',
    category: 'salad',
    timeMinutes: 25,
    ingredients: [
      ing('chicken-breast', 1, 'pcs'), ing('cucumber', 1, 'pcs'), opt('tomato', 1, 'pcs'), ing('sesame-paste', 2, 'tbsp'), ing('soy-sauce', 1.5, 'tbsp'),
      ing('rice-vinegar', 1, 'tbsp'), ing('sugar', 1, 'tbsp'), ing('sesame-oil', 1, 'tsp'), toTaste('ra-yu', true),
    ],
    steps: {
      ja: [
        '鶏むね肉は熱湯に入れて火を止め、蓋をして20分置いて余熱で火を通し、手で裂く。',
        'きゅうりはせん切り、トマトはくし形に切る。',
        '練りごま・しょうゆ・酢・砂糖・ごま油を混ぜ、盛り付けた鶏ときゅうりにかけてラー油を垂らす。',
      ],
      en: [
        'Drop the chicken into boiling water, turn off the heat, cover and leave 20 minutes to poach; shred by hand.',
        'Cut the cucumber into matchsticks and the tomato into wedges.',
        'Mix the sesame paste, soy sauce, vinegar, sugar and sesame oil, pour over the chicken and cucumber and add chili oil.',
      ],
    },
  }),
  recipe({
    id: 'sweet-and-sour-pork',
    name: { ja: '酢豚', en: 'Sweet and sour pork' },
    description: { ja: '揚げた豚肉と野菜を甘酢あんで絡める。', en: 'Fried pork and vegetables coated in a tangy sweet-and-sour glaze.' },
    cuisine: 'chinese',
    category: 'main',
    timeMinutes: 35,
    ingredients: [
      ing('pork-loin', 250, 'g'), ing('onion', 0.5, 'pcs'), ing('bell-pepper', 1, 'pcs'), ing('carrot', 0.5, 'pcs'), ing('ketchup', 3, 'tbsp'),
      ing('rice-vinegar', 2, 'tbsp'), ing('sugar', 2, 'tbsp'), ing('soy-sauce', 1, 'tbsp'), ing('potato-starch', 3, 'tbsp'), fryingOil(),
    ],
    steps: {
      ja: [
        '豚肉は一口大に切って片栗粉大さじ2をまぶし、170℃の油で揚げる。野菜は乱切りにする。',
        'ケチャップ・酢・砂糖・しょうゆ・水100mlを混ぜて甘酢を作る。',
        'フライパンで野菜を炒め、甘酢を加えて煮立て、残りの片栗粉を水で溶いて加えてとろみをつける。',
        '揚げた豚肉を戻して絡める。',
      ],
      en: [
        'Cut the pork into bite-size pieces, coat in 2 tablespoons of potato starch and fry at 170°C. Cut the vegetables into chunks.',
        'Mix the ketchup, vinegar, sugar, soy sauce and 100 ml water.',
        'Stir-fry the vegetables, add the sauce, bring to a boil and thicken with the remaining starch dissolved in water.',
        'Return the pork to the pan and toss to coat.',
      ],
    },
  }),
  recipe({
    id: 'tenshinhan',
    name: { ja: '天津飯', en: 'Tenshinhan (crab omelette rice)' },
    description: { ja: 'かに玉をご飯にのせて甘酢あんをかける。', en: 'Crab-stick omelette over rice with a glossy sweet-sour sauce.' },
    cuisine: 'chinese',
    category: 'rice',
    timeMinutes: 15,
    ingredients: [
      ing('rice', 300, 'g'), ing('egg', 4, 'pcs'), ing('crab-stick', 6, 'pcs'), toTaste('scallion'), ing('chicken-stock-powder', 1, 'tsp'),
      ing('soy-sauce', 1, 'tbsp'), ing('rice-vinegar', 1, 'tbsp'), ing('sugar', 1, 'tbsp'), ing('potato-starch', 1, 'tbsp'), ing('sesame-oil', 1, 'tsp'),
    ],
    steps: {
      ja: [
        '小鍋に水200ml・鶏ガラスープの素・しょうゆ・酢・砂糖を煮立て、水溶き片栗粉でとろみをつけてあんを作る。',
        '卵を溶き、ほぐしたカニカマと小口切りの小ねぎを混ぜる。',
        'フライパンにごま油を熱し、卵液の半量を流して半熟のオムレツにし、ご飯にのせる。もう1つも同様に作る。',
        'あんをかける。',
      ],
      en: [
        'Boil 200 ml water with the stock powder, soy sauce, vinegar and sugar, then thicken with the potato starch dissolved in water.',
        'Beat the eggs with the shredded crab sticks and sliced scallion.',
        'Heat the sesame oil, pour in half the egg, cook to a soft omelette and lay over rice. Repeat.',
        'Pour the sauce over the top.',
      ],
    },
  }),
  recipe({
    id: 'chuka-don',
    name: { ja: '中華丼', en: 'Chuka-don (stir-fry rice bowl)' },
    description: { ja: '白菜と豚肉の八宝菜風あんをご飯にかける。', en: 'Rice topped with a saucy stir-fry of pork, napa cabbage and vegetables.' },
    cuisine: 'chinese',
    category: 'rice',
    timeMinutes: 20,
    ingredients: [
      ing('rice', 300, 'g'), ing('pork-thin-sliced', 120, 'g'), ing('napa-cabbage', 200, 'g'), ing('carrot', 0.3, 'pcs'), ing('shiitake', 2, 'pcs'), opt('bean-sprouts', 100, 'g'),
      ing('chicken-stock-powder', 1, 'tsp'), ing('soy-sauce', 1, 'tbsp'), ing('oyster-sauce', 1, 'tbsp'), ing('potato-starch', 1.5, 'tbsp'), ing('sesame-oil', 1, 'tsp'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        '白菜はざく切り、にんじんは短冊切り、しいたけは薄切りにする。',
        'フライパンに油を熱し、豚肉を炒めてから野菜を加えて炒める。',
        '水200ml・鶏ガラスープの素・しょうゆ・オイスターソースを加えて3分煮、水溶き片栗粉でとろみをつけてごま油を垂らす。',
        'ご飯にかける。',
      ],
      en: [
        'Roughly chop the napa cabbage, cut the carrot into thin rectangles and slice the shiitake.',
        'Heat the oil, cook the pork, then add the vegetables and stir-fry.',
        'Add 200 ml water, the stock powder, soy sauce and oyster sauce; simmer 3 minutes, thicken with the starch dissolved in water and finish with sesame oil.',
        'Spoon over rice.',
      ],
    },
  }),
  recipe({
    id: 'harusame-salad',
    name: { ja: '春雨サラダ', en: 'Glass noodle salad' },
    description: { ja: 'つるっとした春雨を中華風ドレッシングで。', en: 'Chilled glass noodles in a sesame-soy dressing.' },
    cuisine: 'chinese',
    category: 'salad',
    timeMinutes: 15,
    ingredients: [
      ing('harusame', 50, 'g'), ing('cucumber', 0.5, 'pcs'), ing('ham', 2, 'slice'), opt('egg', 1, 'pcs'), ing('soy-sauce', 2, 'tbsp'),
      ing('rice-vinegar', 2, 'tbsp'), ing('sugar', 1, 'tbsp'), ing('sesame-oil', 1, 'tbsp'), ing('sesame-seeds', 1, 'tsp'),
    ],
    steps: {
      ja: [
        '春雨は熱湯で戻し、水気を切って食べやすく切る。きゅうりとハムはせん切りにし、卵は薄焼きにして細切りにする。',
        'しょうゆ・酢・砂糖・ごま油を混ぜてドレッシングを作る。',
        'すべてを和えていりごまをふり、冷蔵庫で冷やす。',
      ],
      en: [
        'Soak the glass noodles in boiling water, drain and cut. Cut the cucumber and ham into matchsticks; make a thin omelette and slice it.',
        'Mix the soy sauce, vinegar, sugar and sesame oil.',
        'Toss everything together, sprinkle with sesame seeds and chill.',
      ],
    },
  }),
  recipe({
    id: 'tomato-egg-stir-fry',
    name: { ja: 'トマトと卵の中華炒め', en: 'Tomato and egg stir-fry' },
    description: { ja: 'トマトの酸味とふわふわ卵の家庭中華。', en: 'Homestyle Chinese stir-fry of juicy tomato and soft eggs.' },
    cuisine: 'chinese',
    category: 'side',
    timeMinutes: 10,
    ingredients: [ing('tomato', 2, 'pcs'), ing('egg', 3, 'pcs'), toTaste('salt'), ing('sugar', 0.5, 'tsp'), ing('chicken-stock-powder', 0.5, 'tsp'), ing('sesame-oil', 1, 'tbsp'), toTaste('scallion', true)],
    steps: {
      ja: [
        'トマトはくし形に切る。卵は塩少々を加えて溶く。',
        'フライパンにごま油を熱し、卵を半熟に炒めて取り出す。',
        'トマトを炒めて砂糖と鶏ガラスープの素を加え、卵を戻してさっと合わせ、小ねぎを散らす。',
      ],
      en: [
        'Cut the tomatoes into wedges. Beat the eggs with a pinch of salt.',
        'Heat the sesame oil, softly scramble the eggs and remove.',
        'Stir-fry the tomato with the sugar and stock powder, return the eggs, toss briefly and top with scallion.',
      ],
    },
  }),
  recipe({
    id: 'chinese-corn-soup',
    name: { ja: '中華風コーンスープ', en: 'Chinese corn soup' },
    description: { ja: 'コーン缶と卵で作るとろみスープ。', en: 'Thick corn soup finished with swirled egg.' },
    cuisine: 'chinese',
    category: 'soup',
    timeMinutes: 10,
    ingredients: [ing('canned-corn', 150, 'g'), ing('egg', 1, 'pcs'), ing('chicken-stock-powder', 2, 'tsp'), ing('potato-starch', 1, 'tsp'), toTaste('salt'), ing('sesame-oil', 0.5, 'tsp'), toTaste('scallion', true)],
    steps: {
      ja: [
        '鍋に水400ml・鶏ガラスープの素・コーンを入れて煮立てる。',
        '水溶き片栗粉でとろみをつけ、溶き卵を回し入れて塩で味を調える。',
        'ごま油を垂らし、小ねぎを散らす。',
      ],
      en: [
        'Bring 400 ml water, the stock powder and the corn to a boil.',
        'Thicken with the potato starch dissolved in water, swirl in the beaten egg and season with salt.',
        'Finish with sesame oil and scallion.',
      ],
    },
  }),
];
