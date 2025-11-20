// ============================================================================
// Campaigns Module - Quizzes Types
// ============================================================================

export interface Quiz {
  id: string;
  tenantId: string;
  moduleId: string;
  passScore: number;
  timeLimitSecs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  tenantId: string;
  quizId: string;
  text: string;
  order: number;
  createdAt: string;
}

export interface QuizOption {
  id: string;
  tenantId: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface QuizSubmission {
  id: string;
  tenantId: string;
  moduleId: string;
  participantId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
  answers: Record<string, string | string[]>; // questionId -> selectedOptionId (single) or selectedOptionIds (multi)
}

export interface QuizFormData {
  passScore: number;
  timeLimitSecs?: number | null;
}

export interface QuestionFormData {
  text: string;
  order: number;
}

export interface OptionFormData {
  text: string;
  isCorrect: boolean;
}

export interface QuizWithQuestions extends Quiz {
  questions: Array<QuizQuestion & { options: QuizOption[] }>;
}

export interface QuizSubmissionPayload {
  answers: Record<string, string | string[]>; // questionId -> selectedOptionId (single) or selectedOptionIds (multi)
}

export interface QuizGradingResult {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
}
