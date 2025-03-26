
export interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface CarInfo {
  make: string;
  model: string;
  year: string;
  vin: string;
}

export type BookingStep = "date" | "time" | "service" | "info" | "confirm";

export const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];
