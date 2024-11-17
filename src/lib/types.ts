export type FrequencyType = 'daily' | 'weekly' | 'monthly';

export interface Frequency {
  type: FrequencyType;
  days?: number[];
}

export interface HabitCompletion {
  date: string; // YYYY-MM-DD形式
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: Frequency;
  startDate: Date;
  streak: number;
  completions: HabitCompletion[]; // 日付ごとの完了状態
} 