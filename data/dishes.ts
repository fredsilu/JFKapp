import { Dish } from '@/types';
import { INGREDIENTS } from './ingredients';

export const DISHES: Dish[] = [
  {
    id: '1',
    name: 'Crêpe Suzette',
    description: 'Crêpes flambées à l\'orange et au Grand Marnier',
    image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&q=80',
    ingredients: [
      { ingredient: INGREDIENTS[0], quantity: 0.25 }, // 250g de farine
      { ingredient: INGREDIENTS[1], quantity: 4 }, // 4 œufs
      { ingredient: INGREDIENTS[2], quantity: 0.5 }, // 500ml de lait
    ],
    preparationTime: 15,
    servings: 2,
  },
  {
    id: '2',
    name: 'Galette Complète',
    description: 'Galette de sarrasin, œuf, jambon et fromage',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&h=300&q=80',
    ingredients: [
      { ingredient: INGREDIENTS[0], quantity: 0.2 }, // 200g de farine
      { ingredient: INGREDIENTS[1], quantity: 2 }, // 2 œufs
      { ingredient: INGREDIENTS[2], quantity: 0.3 }, // 300ml de lait
    ],
    preparationTime: 10,
    servings: 1,
  },
];