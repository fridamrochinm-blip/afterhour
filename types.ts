export type Card = {
  id: string;
  token: string;
  lanyard_no: string | null;
  user_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  title: string | null;
  company: string | null;
  bio: string | null;
  instagram: string | null;
  linkedin: string | null;
  website: string | null;
  photo_url: string | null;
  show_phone: boolean;
  show_email: boolean;
  active: boolean;
  created_at: string;
};

export type FormState = { ok?: boolean; error?: string; message?: string };
