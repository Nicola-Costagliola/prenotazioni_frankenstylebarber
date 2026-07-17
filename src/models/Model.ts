export type TimeSlot = {
  id: string;
  label: string;
  start: string;
  end: string;
};

export type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

export type Review = {
  name: string;
  rating: number;
  title: string;
  text: string;
  date: string;
};

export type Service = {
  id: number;
  name: string;
  price: string;
};
