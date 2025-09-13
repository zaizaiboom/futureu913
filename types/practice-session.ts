import { QualitativeFeedback } from './qualitative-feedback';

export interface PracticeSession {
  id: string;
  question_id: number;
  stage_id: number;
  category_id: number;
  user_answer: string;
  ai_feedback: string;
  created_at: string;
  overall_score: number;
  content_score: number;
  logic_score: number;
  expression_score: number;
  practice_duration: number;
  interview_questions: {
    question_text: string;
    expected_answer?: string;
  };
  interview_stages: {
    stage_name: string;
  };
  question_categories: {
    category_name: string;
  };
  qualitative_feedback?: QualitativeFeedback;
}