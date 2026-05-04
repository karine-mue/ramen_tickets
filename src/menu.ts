export type RamenItem = {
  code: string;
  name: string;
  price: number;
};

export type ToppingItem = {
  code: string;
  name: string;
  price: number;
};

export type SideItem = {
  code: string;
  name: string;
  price: number;
  isAlcohol?: boolean;
};

export type SetItem = {
  code: string;
  name: string;
  description: string;
  sideDiscount: number; // discount vs buying side standalone
  includedSideCodes: string[];
};

export const RAMEN_ITEMS: RamenItem[] = [
  { code: 'R001', name: '醤油ラーメン', price: 850 },
  { code: 'R002', name: '味噌ラーメン', price: 880 },
  { code: 'R003', name: '塩ラーメン', price: 850 },
];

export const TOPPING_ITEMS: ToppingItem[] = [
  { code: 'T001', name: '味玉', price: 100 },
  { code: 'T002', name: 'チャーシュー', price: 150 },
  { code: 'T003', name: '海苔', price: 80 },
  { code: 'T004', name: 'ネギ', price: 50 },
  { code: 'T005', name: 'コーン', price: 80 },
  { code: 'T006', name: 'バター', price: 80 },
];

export const SIDE_ITEMS: SideItem[] = [
  { code: 'S001', name: 'ビール', price: 500, isAlcohol: true },
  { code: 'S002', name: '餃子', price: 330 },
  { code: 'S003', name: 'チャーハン', price: 400 },
];

// 餃子セット: ramen (chosen by customer) + 餃子, 50 yen off gyoza
export const SET_ITEMS: SetItem[] = [
  {
    code: 'SET001',
    name: '餃子セット',
    description: 'ラーメン + 餃子 (¥50 お得)',
    sideDiscount: 50,
    includedSideCodes: ['S002'],
  },
];

export const findRamen = (code: string): RamenItem | undefined =>
  RAMEN_ITEMS.find(r => r.code === code);

export const findSide = (code: string): SideItem | undefined =>
  SIDE_ITEMS.find(s => s.code === code);

export const findSet = (code: string): SetItem | undefined =>
  SET_ITEMS.find(s => s.code === code);
