export interface Lecture {
  id: number;
  title: string;
  description: string;
  professor_name: string;
  access_code: string;
  created_at: string;
  year: number;
  semester: number;
  major: string;
}

export interface Assignment {
  id: number;
  lecture_id: number;
  week: number;
  week_order: number;
  topic: string;
  video_title: string;
  practice_content: string;
  main_content: string;
  submit_types: string[] | string;
  open_date: string | null;
  due_date: string | null;
  created_at: string;
}
