import type { Recipe } from '../../domain/types';
import { ing, recipe, toTaste } from './helpers';

export const OTHER_RECIPES: Recipe[] = [
  recipe({
    id: 'kimchi-fried-rice',
    name: { ja: 'キムチチャーハン', en: 'Kimchi fried rice' },
    description: { ja: 'キムチと豚バラの旨みで炒める韓国風チャーハン。', en: 'Korean-style fried rice with kimchi and pork belly.' },
    cuisine: 'other',
    category: 'rice',
    timeMinutes: 15,
    ingredients: [ing('rice', 300, 'g'), ing('kimchi', 150, 'g'), ing('pork-belly', 100, 'g'), ing('egg', 2, 'pcs'), ing('sesame-oil', 1, 'tbsp'), ing('soy-sauce', 1, 'tsp'), toTaste('scallion', true)],
    steps: {
      ja: [
        '豚バラは1cm幅、キムチは粗く刻む。',
        'フライパンにごま油を熱し、豚肉を炒めてからキムチを加えて炒める。',
        'ご飯を加えてほぐしながら炒め、しょうゆで味を調える。',
        '別に目玉焼きを作ってのせ、小ねぎを散らす。',
      ],
      en: [
        'Cut the pork into 1 cm pieces and roughly chop the kimchi.',
        'Heat the sesame oil, cook the pork, then add the kimchi and stir-fry.',
        'Add the rice, break it up as you fry and season with soy sauce.',
        'Top with a fried egg and scallion.',
      ],
    },
  }),
];
