export type CourseGenerationInput = {
  topic: string;
  level: string;
  industry?: string;
  profession?: string;
  number_of_modules?: number;
};

export type CourseModule = {
  title: string;
  description: string;
  lessons: string[];
};

export type CourseGenerationOutput = {
  course_title: string;
  summary: string;
  modules: CourseModule[];
};

export type CourseRecord = {
  id: string;
  user_id: string | null;
  title: string;
  topic: string;
  level: string;
  industry: string | null;
  profession: string | null;
  summary: string;
  outline_json: CourseGenerationOutput;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  outlineJson: unknown;
};
