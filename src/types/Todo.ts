// types.ts
export type FilterType = 'All' | 'Active' | 'Completed';

export type Todo = {
  id: number;
  userId: number; // ✅ тепер існує
  title: string;
  completed: boolean;
  loading?: boolean;
};
