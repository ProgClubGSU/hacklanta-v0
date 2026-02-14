export const FOOD_ORDER_STATUSES = ['placed', 'preparing', 'ready', 'picked_up'] as const;
export type FoodOrderStatus = (typeof FOOD_ORDER_STATUSES)[number];
