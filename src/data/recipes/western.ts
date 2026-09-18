import type { Recipe } from '../../domain/types';
import { ing, opt, recipe, toTaste } from './helpers';

export const WESTERN_RECIPES: Recipe[] = [
  recipe({
    id: 'hamburg-steak',
    name: { ja: 'ハンバーグ', en: 'Hamburg steak' },
    description: { ja: 'ふっくらジューシーな洋食屋さんの定番。', en: 'Juicy Japanese-style hamburger patties with a ketchup-Worcestershire sauce.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 30,
    ingredients: [
      ing('ground-meat-mix', 300, 'g'), ing('onion', 0.5, 'pcs'), ing('egg', 1, 'pcs'), ing('bread-crumbs', 30, 'g'), ing('milk', 2, 'tbsp'),
      toTaste('salt'), toTaste('black-pepper'), ing('ketchup', 2, 'tbsp'), ing('worcestershire', 2, 'tbsp'), ing('cooking-oil', 1, 'tbsp'),
    ],
    steps: {
      ja: [
        '玉ねぎはみじん切りにして油少々で炒め、冷ます。パン粉は牛乳に浸す。',
        'ボウルにひき肉・玉ねぎ・パン粉・卵・塩・こしょうを入れ、粘りが出るまで練って2等分し、小判形にする。',
        'フライパンに油を熱し、中火で両面に焼き色をつけ、蓋をして弱火で7分蒸し焼きにする。',
        '取り出した後のフライパンにケチャップとウスターソースを入れて軽く煮詰め、ハンバーグにかける。',
      ],
      en: [
        'Mince the onion, soften it in a little oil and let cool. Soak the panko in the milk.',
        'Knead the meat with the onion, panko, egg, salt and pepper until sticky, then shape into two oval patties.',
        'Heat the oil, brown both sides over medium heat, then cover and cook on low for 7 minutes.',
        'Remove the patties, simmer the ketchup and Worcestershire sauce in the pan briefly and pour over.',
      ],
    },
  }),
  recipe({
    id: 'omurice',
    name: { ja: 'オムライス', en: 'Omurice' },
    description: { ja: 'ケチャップライスをふわふわ卵で包む。', en: 'Ketchup fried rice wrapped in a soft omelette.' },
    cuisine: 'western',
    category: 'rice',
    timeMinutes: 20,
    ingredients: [
      ing('rice', 300, 'g'), ing('egg', 4, 'pcs'), ing('chicken-thigh', 100, 'g'), ing('onion', 0.5, 'pcs'),
      ing('ketchup', 4, 'tbsp'), ing('butter', 10, 'g'), toTaste('salt'), toTaste('black-pepper'),
    ],
    steps: {
      ja: [
        '鶏肉は小さく切り、玉ねぎはみじん切りにする。',
        'フライパンにバター半量を熱して鶏肉と玉ねぎを炒め、ご飯とケチャップを加えて炒め、塩こしょうで味を調える。',
        '別のフライパンで残りのバターを熱し、溶き卵2個分を流して半熟のオムレツを作り、ライスの半量にのせる。同様にもう1つ作る。',
        '仕上げにケチャップをかける。',
      ],
      en: [
        'Dice the chicken and mince the onion.',
        'Melt half the butter, cook the chicken and onion, then add the rice and ketchup and stir-fry; season with salt and pepper.',
        'In another pan melt the remaining butter, pour in two beaten eggs and make a soft omelette; lay it over half the rice. Repeat.',
        'Finish with a squeeze of ketchup.',
      ],
    },
  }),
  recipe({
    id: 'carbonara',
    name: { ja: 'カルボナーラ', en: 'Carbonara' },
    description: { ja: '卵とチーズのこくがベーコンに絡む濃厚パスタ。', en: 'Rich pasta with bacon, egg and cheese.' },
    cuisine: 'western',
    category: 'noodle',
    timeMinutes: 20,
    ingredients: [ing('spaghetti', 200, 'g'), ing('bacon', 80, 'g'), ing('egg', 2, 'pcs'), ing('parmesan', 4, 'tbsp'), toTaste('black-pepper'), opt('garlic', 1, 'clove'), opt('heavy-cream', 50, 'ml')],
    steps: {
      ja: [
        'ボウルに卵・粉チーズ・生クリーム・こしょうを混ぜておく。',
        'スパゲッティを塩を入れた熱湯で表示時間通りゆでる。',
        'フライパンでベーコンとつぶしたにんにくを弱火で炒め、脂を出す。',
        'ゆで上がったパスタとゆで汁大さじ2をフライパンに加えて火を止め、卵液を加えて素早く混ぜる。',
      ],
      en: [
        'Mix the eggs, parmesan, cream and pepper in a bowl.',
        'Cook the spaghetti in salted boiling water for the time on the packet.',
        'Cook the bacon with the crushed garlic over low heat until the fat renders.',
        'Add the drained pasta and 2 tablespoons of pasta water to the pan, turn off the heat and quickly stir in the egg mixture.',
      ],
    },
  }),
  recipe({
    id: 'napolitan',
    name: { ja: 'ナポリタン', en: 'Napolitan spaghetti' },
    description: { ja: 'ケチャップで炒める昭和喫茶の味。', en: 'Retro Japanese ketchup spaghetti with sausage and peppers.' },
    cuisine: 'western',
    category: 'noodle',
    timeMinutes: 20,
    ingredients: [
      ing('spaghetti', 200, 'g'), ing('sausage', 4, 'pcs'), ing('onion', 0.5, 'pcs'), ing('bell-pepper', 1, 'pcs'),
      ing('ketchup', 5, 'tbsp'), ing('butter', 10, 'g'), opt('button-mushroom', 4, 'pcs'), toTaste('parmesan', true),
    ],
    steps: {
      ja: [
        'スパゲッティを表示時間より1分長くゆでる。ウインナーは斜め切り、玉ねぎは薄切り、ピーマンは細切りにする。',
        'フライパンにバターを熱し、ウインナー・玉ねぎ・ピーマン・マッシュルームを炒める。',
        'ケチャップを加えて軽く煮詰め、パスタを加えて炒め合わせる。',
        '粉チーズをふる。',
      ],
      en: [
        'Cook the spaghetti 1 minute longer than the packet says. Slice the sausages, onion, pepper and mushrooms.',
        'Melt the butter and stir-fry the sausage, onion, pepper and mushrooms.',
        'Add the ketchup, cook it down slightly, then toss with the pasta.',
        'Sprinkle with parmesan.',
      ],
    },
  }),
  recipe({
    id: 'peperoncino',
    name: { ja: 'ペペロンチーノ', en: 'Spaghetti aglio e olio' },
    description: { ja: 'にんにくと唐辛子の香りだけで食べる潔いパスタ。', en: 'Minimal pasta with garlic, chili and olive oil.' },
    cuisine: 'western',
    category: 'noodle',
    timeMinutes: 15,
    ingredients: [ing('spaghetti', 200, 'g'), ing('garlic', 2, 'clove'), ing('olive-oil', 3, 'tbsp'), ing('chili-pepper', 1, 'pcs'), toTaste('salt')],
    steps: {
      ja: [
        'スパゲッティを塩を入れた熱湯でゆでる。',
        'フライパンにオリーブオイル・薄切りにんにく・種を取った唐辛子を入れ、弱火で香りが出るまで熱する。',
        'ゆで汁大さじ3を加えて乳化させ、ゆでたパスタを加えて和え、塩で味を調える。',
      ],
      en: [
        'Cook the spaghetti in salted boiling water.',
        'Warm the olive oil with sliced garlic and the deseeded chili over low heat until fragrant.',
        'Add 3 tablespoons of pasta water, swirl to emulsify, toss in the pasta and season with salt.',
      ],
    },
  }),
  recipe({
    id: 'tomato-pasta',
    name: { ja: 'トマトソースパスタ', en: 'Tomato sauce pasta' },
    description: { ja: 'トマト缶で作る基本のトマトソース。', en: 'A simple tomato sauce made from canned tomatoes.' },
    cuisine: 'western',
    category: 'noodle',
    timeMinutes: 25,
    ingredients: [
      ing('spaghetti', 200, 'g'), ing('canned-tomatoes', 1, 'can'), ing('garlic', 1, 'clove'), ing('onion', 0.5, 'pcs'),
      ing('olive-oil', 2, 'tbsp'), toTaste('salt'), toTaste('parmesan', true), opt('bacon', 50, 'g'),
    ],
    steps: {
      ja: [
        'フライパンにオリーブオイルとみじん切りのにんにくを熱し、みじん切りの玉ねぎとベーコンを炒める。',
        'トマト缶を加えて中火で10分煮詰め、塩で味を調える。',
        'スパゲッティを塩を入れた熱湯でゆで、ソースと和えて粉チーズをふる。',
      ],
      en: [
        'Heat the olive oil with minced garlic, then cook the minced onion and bacon until soft.',
        'Add the canned tomatoes and simmer over medium heat for 10 minutes; season with salt.',
        'Cook the spaghetti in salted water, toss with the sauce and top with parmesan.',
      ],
    },
  }),
  recipe({
    id: 'mentaiko-pasta',
    name: { ja: '明太子パスタ', en: 'Mentaiko pasta' },
    description: { ja: 'バターと明太子を和えるだけの和風パスタ。', en: 'Japanese-style pasta tossed with butter and spicy cod roe.' },
    cuisine: 'western',
    category: 'noodle',
    timeMinutes: 15,
    ingredients: [ing('spaghetti', 200, 'g'), ing('mentaiko', 60, 'g'), ing('butter', 20, 'g'), ing('soy-sauce', 1, 'tsp'), toTaste('nori', true), opt('shiso', 2, 'pcs')],
    steps: {
      ja: [
        '明太子は薄皮を除いてほぐし、バター・しょうゆとボウルで混ぜる。',
        'スパゲッティを塩を入れた熱湯でゆでる。',
        '熱いパスタをボウルに加えて和え、刻み海苔とせん切りの大葉をのせる。',
      ],
      en: [
        'Remove the membrane from the mentaiko and mix the roe with the butter and soy sauce in a bowl.',
        'Cook the spaghetti in salted boiling water.',
        'Toss the hot pasta in the bowl and top with shredded nori and shiso.',
      ],
    },
  }),
  recipe({
    id: 'cream-stew',
    name: { ja: 'クリームシチュー', en: 'Cream stew' },
    description: { ja: 'ルー不要、牛乳とバターで作るやさしいシチュー。', en: 'A gentle chicken and vegetable stew thickened with a butter-flour roux.' },
    cuisine: 'western',
    category: 'soup',
    timeMinutes: 40,
    ingredients: [
      ing('chicken-thigh', 250, 'g'), ing('potato', 2, 'pcs'), ing('carrot', 0.5, 'pcs'), ing('onion', 1, 'pcs'), ing('milk', 300, 'ml'),
      ing('butter', 20, 'g'), ing('flour', 3, 'tbsp'), ing('consomme', 1, 'tsp'), toTaste('salt'), opt('broccoli', 80, 'g'),
    ],
    steps: {
      ja: [
        '鶏肉と野菜は一口大に切る。',
        '鍋にバターを溶かして鶏肉と玉ねぎを炒め、薄力粉をふり入れて粉気がなくなるまで炒める。',
        '水300mlとコンソメ、にんじん・じゃがいもを加え、蓋をして弱火で15分煮る。',
        '牛乳と小房に分けたブロッコリーを加えて5分煮、塩で味を調える。',
      ],
      en: [
        'Cut the chicken and vegetables into bite-size pieces.',
        'Melt the butter, cook the chicken and onion, sprinkle in the flour and stir until no dry flour remains.',
        'Add 300 ml water, the consommé, carrot and potato; cover and simmer on low for 15 minutes.',
        'Add the milk and broccoli florets, simmer 5 minutes and season with salt.',
      ],
    },
  }),
  recipe({
    id: 'minestrone',
    name: { ja: 'ミネストローネ', en: 'Minestrone' },
    description: { ja: '野菜たっぷりのトマトスープ。', en: 'Vegetable-packed tomato soup.' },
    cuisine: 'western',
    category: 'soup',
    timeMinutes: 30,
    ingredients: [
      ing('canned-tomatoes', 1, 'can'), ing('onion', 0.5, 'pcs'), ing('carrot', 0.5, 'pcs'), ing('bacon', 50, 'g'), opt('potato', 1, 'pcs'),
      opt('celery', 0.5, 'stalk'), ing('consomme', 1, 'tsp'), ing('olive-oil', 1, 'tbsp'), toTaste('salt'),
    ],
    steps: {
      ja: [
        '野菜とベーコンは1cm角に切る。',
        '鍋にオリーブオイルを熱し、ベーコンと野菜を中火で5分炒める。',
        'トマト缶・水400ml・コンソメを加え、蓋をして15分煮て塩で味を調える。',
      ],
      en: [
        'Dice the vegetables and bacon into 1 cm pieces.',
        'Heat the olive oil and cook the bacon and vegetables over medium heat for 5 minutes.',
        'Add the tomatoes, 400 ml water and the consommé; cover, simmer 15 minutes and season with salt.',
      ],
    },
  }),
  recipe({
    id: 'potato-salad',
    name: { ja: 'ポテトサラダ', en: 'Potato salad' },
    description: { ja: 'ほくほくのじゃがいもをマヨネーズで和える定番サラダ。', en: 'Classic creamy potato salad with cucumber, carrot and ham.' },
    cuisine: 'western',
    category: 'salad',
    timeMinutes: 25,
    ingredients: [
      ing('potato', 3, 'pcs'), ing('cucumber', 0.5, 'pcs'), ing('carrot', 0.3, 'pcs'), ing('ham', 2, 'slice'),
      ing('mayonnaise', 3, 'tbsp'), toTaste('salt'), toTaste('black-pepper'), opt('egg', 1, 'pcs'),
    ],
    steps: {
      ja: [
        'じゃがいもは皮をむいて一口大に切り、薄切りのにんじんとともに柔らかくゆでる。卵は固ゆでにする。',
        'きゅうりは薄切りにして塩をふり、水気を絞る。ハムは短冊に切る。',
        'じゃがいもを熱いうちに粗くつぶし、粗熱がとれたらすべてをマヨネーズで和え、塩こしょうで味を調える。',
      ],
      en: [
        'Peel and cut the potatoes, boil with the sliced carrot until tender. Hard-boil the egg.',
        'Thinly slice the cucumber, salt it and squeeze dry. Cut the ham into strips.',
        'Roughly mash the potatoes while hot; once cooled slightly, fold everything together with mayonnaise, salt and pepper.',
      ],
    },
  }),
  recipe({
    id: 'coleslaw',
    name: { ja: 'コールスロー', en: 'Coleslaw' },
    description: { ja: 'せん切りキャベツのシャキシャキサラダ。', en: 'Crunchy shredded cabbage salad in a tangy mayo dressing.' },
    cuisine: 'western',
    category: 'salad',
    timeMinutes: 15,
    ingredients: [ing('cabbage', 200, 'g'), ing('carrot', 0.3, 'pcs'), ing('canned-corn', 50, 'g'), ing('mayonnaise', 3, 'tbsp'), ing('rice-vinegar', 1, 'tbsp'), ing('sugar', 1, 'tsp'), toTaste('salt')],
    steps: {
      ja: [
        'キャベツとにんじんはせん切りにし、塩をふって10分置き、水気を絞る。',
        'マヨネーズ・酢・砂糖を混ぜてドレッシングを作る。',
        'キャベツ・にんじん・コーンをドレッシングで和える。',
      ],
      en: [
        'Shred the cabbage and carrot, salt them, rest 10 minutes and squeeze out the water.',
        'Mix the mayonnaise, vinegar and sugar.',
        'Toss the cabbage, carrot and corn in the dressing.',
      ],
    },
  }),
  recipe({
    id: 'herb-chicken-saute',
    name: { ja: '鶏もものハーブソテー', en: 'Herb chicken sauté' },
    description: { ja: '皮パリッと焼いた鶏ももにハーブとレモンを添えて。', en: 'Crisp-skinned chicken thigh with herbs, garlic and lemon.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 20,
    ingredients: [ing('chicken-thigh', 300, 'g'), toTaste('salt'), toTaste('black-pepper'), ing('garlic', 1, 'clove'), ing('olive-oil', 1, 'tbsp'), opt('dried-herbs', 1, 'tsp'), opt('lemon', 0.5, 'pcs')],
    steps: {
      ja: [
        '鶏肉に塩・こしょう・乾燥ハーブをすり込む。',
        'フライパンにオリーブオイルとつぶしたにんにくを熱し、皮目から中火で6分、裏返して4分焼く。',
        '食べやすく切ってレモンを添える。',
      ],
      en: [
        'Rub the chicken with salt, pepper and dried herbs.',
        'Heat the olive oil with crushed garlic; cook skin side down over medium heat for 6 minutes, flip and cook 4 minutes more.',
        'Slice and serve with lemon.',
      ],
    },
  }),
  recipe({
    id: 'french-toast',
    name: { ja: 'フレンチトースト', en: 'French toast' },
    description: { ja: '卵液に浸した食パンをバターで焼く朝食の定番。', en: 'Bread soaked in sweet egg custard and fried in butter.' },
    cuisine: 'western',
    category: 'dessert',
    timeMinutes: 15,
    ingredients: [ing('bread', 2, 'slice'), ing('egg', 1, 'pcs'), ing('milk', 100, 'ml'), ing('sugar', 1, 'tbsp'), ing('butter', 10, 'g'), toTaste('honey', true)],
    steps: {
      ja: [
        '卵・牛乳・砂糖を混ぜ、食パンを両面5分ずつ浸す。',
        'フライパンにバターを溶かし、弱めの中火で両面をきつね色に焼く。',
        'はちみつをかける。',
      ],
      en: [
        'Whisk the egg, milk and sugar and soak the bread 5 minutes per side.',
        'Melt the butter and cook over medium-low heat until golden on both sides.',
        'Drizzle with honey.',
      ],
    },
  }),
  recipe({
    id: 'pancakes',
    name: { ja: 'パンケーキ', en: 'Pancakes' },
    description: { ja: 'ふんわり厚めのおやつパンケーキ。', en: 'Thick, fluffy pancakes.' },
    cuisine: 'western',
    category: 'dessert',
    timeMinutes: 20,
    ingredients: [ing('flour', 150, 'g'), ing('egg', 1, 'pcs'), ing('milk', 120, 'ml'), ing('sugar', 2, 'tbsp'), ing('baking-powder', 1, 'tsp'), ing('butter', 10, 'g'), toTaste('honey', true)],
    steps: {
      ja: [
        '薄力粉・砂糖・ベーキングパウダーを混ぜ、卵と牛乳を加えてダマがなくなるまで混ぜる。',
        'フライパンにバターを薄くひいて弱めの中火で熱し、生地をお玉1杯分流す。',
        '表面に気泡が出たら裏返し、2分焼く。残りも同様に焼き、はちみつをかける。',
      ],
      en: [
        'Mix the flour, sugar and baking powder, then whisk in the egg and milk until smooth.',
        'Lightly butter a pan over medium-low heat and pour in a ladle of batter.',
        'Flip when bubbles appear, cook 2 minutes more, repeat and serve with honey.',
      ],
    },
  }),
  recipe({
    id: 'macaroni-gratin',
    name: { ja: 'マカロニグラタン', en: 'Macaroni gratin' },
    description: { ja: 'ホワイトソースから作るこんがりグラタン。', en: 'Baked macaroni in a homemade white sauce with melted cheese.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 40,
    ingredients: [
      ing('macaroni', 100, 'g'), ing('chicken-thigh', 150, 'g'), ing('onion', 0.5, 'pcs'), ing('milk', 400, 'ml'), ing('butter', 30, 'g'),
      ing('flour', 3, 'tbsp'), ing('shredded-cheese', 60, 'g'), ing('consomme', 0.5, 'tsp'), toTaste('salt'),
    ],
    steps: {
      ja: [
        'マカロニを表示通りゆでる。鶏肉は小さめに切り、玉ねぎは薄切りにする。',
        'フライパンにバターを溶かして鶏肉と玉ねぎを炒め、薄力粉を加えて炒める。牛乳を少しずつ加えてとろみをつけ、コンソメと塩で味を調える。',
        'マカロニを混ぜて耐熱皿に入れ、チーズをのせる。',
        '220℃のオーブンで焼き色がつくまで10分焼く。',
      ],
      en: [
        'Cook the macaroni as directed. Dice the chicken and slice the onion.',
        'Melt the butter, cook the chicken and onion, stir in the flour, then add the milk gradually until thick; season with consommé and salt.',
        'Mix in the macaroni, transfer to a baking dish and top with cheese.',
        'Bake at 220°C for about 10 minutes until browned.',
      ],
    },
  }),
  recipe({
    id: 'pizza-toast',
    name: { ja: 'ピザトースト', en: 'Pizza toast' },
    description: { ja: '食パンで作る手軽なピザ風トースト。', en: 'Quick pizza-style toast on sliced bread.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 10,
    ingredients: [ing('bread', 2, 'slice'), ing('ketchup', 2, 'tbsp'), ing('shredded-cheese', 60, 'g'), opt('bell-pepper', 0.5, 'pcs'), opt('onion', 0.25, 'pcs'), opt('bacon', 1, 'slice')],
    steps: {
      ja: [
        '食パンにケチャップを塗る。ピーマンは輪切り、玉ねぎは薄切り、ベーコンは短冊に切る。',
        '具材とチーズをのせ、トースターでチーズが溶けて焼き色がつくまで5分ほど焼く。',
      ],
      en: [
        'Spread ketchup on the bread. Slice the pepper into rings, thinly slice the onion and cut the bacon into strips.',
        'Top with the vegetables, bacon and cheese and toast about 5 minutes until the cheese melts and browns.',
      ],
    },
  }),
  recipe({
    id: 'ratatouille',
    name: { ja: 'ラタトゥイユ', en: 'Ratatouille' },
    description: { ja: '夏野菜をオリーブオイルとトマトで煮込む。', en: 'Summer vegetables stewed in olive oil and tomato.' },
    cuisine: 'western',
    category: 'side',
    timeMinutes: 35,
    ingredients: [
      ing('eggplant', 1, 'pcs'), ing('zucchini', 1, 'pcs'), ing('paprika', 1, 'pcs'), ing('canned-tomatoes', 1, 'can'),
      ing('onion', 0.5, 'pcs'), ing('garlic', 1, 'clove'), ing('olive-oil', 2, 'tbsp'), toTaste('salt'),
    ],
    steps: {
      ja: [
        '野菜はすべて2cm角に切る。',
        '鍋にオリーブオイルとみじん切りのにんにくを熱し、玉ねぎ・なす・ズッキーニ・パプリカを炒める。',
        'トマト缶と塩を加え、蓋をして弱火で20分煮る。',
      ],
      en: [
        'Cut all the vegetables into 2 cm pieces.',
        'Heat the olive oil with minced garlic and cook the onion, eggplant, zucchini and paprika.',
        'Add the tomatoes and salt, cover and simmer on low for 20 minutes.',
      ],
    },
  }),
  recipe({
    id: 'egg-sandwich',
    name: { ja: 'たまごサンド', en: 'Egg salad sandwich' },
    description: { ja: 'ゆで卵とマヨネーズの定番サンドイッチ。', en: 'Classic sandwich of chopped boiled egg and mayonnaise.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 15,
    ingredients: [ing('bread', 4, 'slice'), ing('egg', 3, 'pcs'), ing('mayonnaise', 3, 'tbsp'), toTaste('salt'), toTaste('black-pepper')],
    steps: {
      ja: [
        '卵を10分ゆでて固ゆでにし、殻をむいて粗く刻む。',
        'マヨネーズ・塩・こしょうで和える。',
        '食パンに挟み、食べやすく切る。',
      ],
      en: [
        'Boil the eggs 10 minutes, peel and roughly chop.',
        'Mix with mayonnaise, salt and pepper.',
        'Sandwich between the bread slices and cut.',
      ],
    },
  }),
  recipe({
    id: 'corn-potage',
    name: { ja: 'コーンポタージュ', en: 'Corn potage' },
    description: { ja: 'コーン缶で作るまろやかなスープ。', en: 'Smooth, sweet corn soup made from canned corn.' },
    cuisine: 'western',
    category: 'soup',
    timeMinutes: 20,
    ingredients: [ing('canned-corn', 200, 'g'), ing('milk', 300, 'ml'), ing('butter', 10, 'g'), ing('onion', 0.25, 'pcs'), ing('consomme', 0.5, 'tsp'), toTaste('salt')],
    steps: {
      ja: [
        '鍋にバターを溶かし、薄切りの玉ねぎを炒める。',
        'コーンと水100ml・コンソメを加えて5分煮、ミキサーでなめらかにする。',
        '鍋に戻して牛乳を加え、温めて塩で味を調える。',
      ],
      en: [
        'Melt the butter and soften the sliced onion.',
        'Add the corn, 100 ml water and the consommé, simmer 5 minutes and blend smooth.',
        'Return to the pot, add the milk, warm through and season with salt.',
      ],
    },
  }),
  recipe({
    id: 'chicken-tomato-stew',
    name: { ja: '鶏肉のトマト煮', en: 'Chicken in tomato sauce' },
    description: { ja: '鶏ももをトマトでじっくり煮込む。', en: 'Chicken thighs braised in garlicky tomato sauce.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 30,
    ingredients: [
      ing('chicken-thigh', 300, 'g'), ing('canned-tomatoes', 1, 'can'), ing('onion', 1, 'pcs'), ing('garlic', 1, 'clove'),
      ing('olive-oil', 1, 'tbsp'), ing('consomme', 1, 'tsp'), toTaste('salt'), opt('shredded-cheese', 40, 'g'),
    ],
    steps: {
      ja: [
        '鶏肉は一口大に切って塩をふる。玉ねぎは薄切り、にんにくはみじん切りにする。',
        'フライパンにオリーブオイルとにんにくを熱し、鶏肉を焼き色がつくまで焼き、玉ねぎを加えて炒める。',
        'トマト缶とコンソメを加え、蓋をして弱火で15分煮る。仕上げにチーズをのせて溶かす。',
      ],
      en: [
        'Cut the chicken into bite-size pieces and salt it. Slice the onion and mince the garlic.',
        'Heat the olive oil with the garlic, brown the chicken, then add the onion and cook until soft.',
        'Add the tomatoes and consommé, cover and simmer on low for 15 minutes. Melt cheese on top to finish.',
      ],
    },
  }),
  recipe({
    id: 'garlic-shrimp',
    name: { ja: 'ガーリックシュリンプ', en: 'Garlic shrimp' },
    description: { ja: 'にんにくバターでえびを炒めるハワイ風の一皿。', en: 'Hawaiian-style shrimp sautéed in garlic butter.' },
    cuisine: 'western',
    category: 'main',
    timeMinutes: 15,
    ingredients: [ing('shrimp', 200, 'g'), ing('garlic', 2, 'clove'), ing('butter', 15, 'g'), ing('olive-oil', 1, 'tbsp'), toTaste('salt'), toTaste('black-pepper'), opt('lemon', 0.5, 'pcs')],
    steps: {
      ja: [
        'えびは殻をむいて背わたを取り、塩・こしょうをふる。にんにくはみじん切りにする。',
        'フライパンにオリーブオイルとバター、にんにくを弱火で熱して香りを出す。',
        'えびを加えて中火で両面を焼き、レモンを絞る。',
      ],
      en: [
        'Peel and devein the shrimp and season with salt and pepper. Mince the garlic.',
        'Warm the olive oil, butter and garlic over low heat until fragrant.',
        'Add the shrimp, cook over medium heat on both sides and finish with lemon.',
      ],
    },
  }),
];
