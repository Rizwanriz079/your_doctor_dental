export type WizardService = {
  id: string;
  name: string;
  category: string;
  short_description: string;
  duration_minutes: number | null;
};

export type WizardDoctor = {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  profile_image_path: string | null;
  serviceIds: string[];
};

export type Slot = { start: string; end: string };

export type PatientDetails = {
  fullName: string;
  phone: string;
  email: string;
  message: string;
  consent: boolean;
};

export const STEPS = ["Service", "Dentist", "Date", "Time", "Your details", "Review"] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;
