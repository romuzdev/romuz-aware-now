import { supabase } from '@/integrations/supabase/client';
import type {
  Quiz,
  QuizQuestion,
  QuizOption,
  QuizSubmission,
  QuizFormData,
  QuestionFormData,
  OptionFormData,
  QuizWithQuestions,
  QuizSubmissionPayload,
  QuizGradingResult,
} from '@/modules/campaigns';

// ============================================================================
// Fetch Quiz with Questions and Options
// ============================================================================

export async function fetchQuizByModule(moduleId: string): Promise<QuizWithQuestions | null> {
  const { data: quiz, error: quizError } = await supabase
    .from('module_quizzes')
    .select('*')
    .eq('module_id', moduleId)
    .maybeSingle();

  if (quizError) throw quizError;
  if (!quiz) return null;

  const { data: questions, error: questionsError } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('order', { ascending: true });

  if (questionsError) throw questionsError;

  const questionsWithOptions = await Promise.all(
    (questions || []).map(async (question) => {
      const { data: options, error: optionsError } = await supabase
        .from('quiz_options')
        .select('*')
        .eq('question_id', question.id);

      if (optionsError) throw optionsError;

      return {
        ...mapQuestion(question),
        options: (options || []).map(mapOption),
      };
    })
  );

  return {
    ...mapQuiz(quiz),
    questions: questionsWithOptions,
  };
}

// ============================================================================
// Create/Update Quiz
// ============================================================================

export async function upsertQuiz(
  tenantId: string,
  moduleId: string,
  formData: QuizFormData
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('module_quizzes')
    .upsert(
      {
        tenant_id: tenantId,
        module_id: moduleId,
        pass_score: formData.passScore,
        time_limit_secs: formData.timeLimitSecs,
      },
      { onConflict: 'tenant_id,module_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return mapQuiz(data);
}

// ============================================================================
// Create/Update/Delete Questions
// ============================================================================

export async function createQuestion(
  tenantId: string,
  quizId: string,
  formData: QuestionFormData
): Promise<QuizQuestion> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      tenant_id: tenantId,
      quiz_id: quizId,
      text: formData.text,
      order: formData.order,
    })
    .select()
    .single();

  if (error) throw error;
  return mapQuestion(data);
}

export async function updateQuestion(
  id: string,
  formData: Partial<QuestionFormData>
): Promise<void> {
  const patch: any = {};
  if (formData.text !== undefined) patch.text = formData.text;
  if (formData.order !== undefined) patch.order = formData.order;

  const { error } = await supabase
    .from('quiz_questions')
    .update(patch)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Create/Update/Delete Options
// ============================================================================

export async function createOption(
  tenantId: string,
  questionId: string,
  formData: OptionFormData
): Promise<QuizOption> {
  const { data, error } = await supabase
    .from('quiz_options')
    .insert({
      tenant_id: tenantId,
      question_id: questionId,
      text: formData.text,
      is_correct: formData.isCorrect,
    })
    .select()
    .single();

  if (error) throw error;
  return mapOption(data);
}

export async function updateOption(
  id: string,
  formData: Partial<OptionFormData>
): Promise<void> {
  const patch: any = {};
  if (formData.text !== undefined) patch.text = formData.text;
  if (formData.isCorrect !== undefined) patch.is_correct = formData.isCorrect;

  const { error } = await supabase
    .from('quiz_options')
    .update(patch)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteOption(id: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_options')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Submit Quiz & Grade
// ============================================================================

export async function submitQuiz(
  tenantId: string,
  moduleId: string,
  participantId: string,
  payload: QuizSubmissionPayload,
  quiz: QuizWithQuestions
): Promise<{ submission: QuizSubmission; grading: QuizGradingResult }> {
  // Grade the quiz
  const grading = gradeQuiz(payload, quiz);

  // Store submission
  const { data, error } = await supabase
    .from('quiz_submissions')
    .insert({
      tenant_id: tenantId,
      module_id: moduleId,
      participant_id: participantId,
      score: grading.score,
      passed: grading.passed,
      answers: payload.answers,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    submission: mapSubmission(data),
    grading,
  };
}

function gradeQuiz(
  payload: QuizSubmissionPayload,
  quiz: QuizWithQuestions
): QuizGradingResult {
  const totalQuestions = quiz.questions.length;
  let correctAnswers = 0;

  quiz.questions.forEach((question) => {
    const selectedOptionId = payload.answers[question.id];
    if (!selectedOptionId) return;

    const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
    if (selectedOption?.isCorrect) {
      correctAnswers++;
    }
  });

  const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const passed = score >= quiz.passScore;

  return {
    score: Math.round(score * 100) / 100,
    passed,
    totalQuestions,
    correctAnswers,
  };
}

// ============================================================================
// Fetch Submissions
// ============================================================================

export async function fetchSubmissionsByParticipant(
  participantId: string
): Promise<QuizSubmission[]> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('*')
    .eq('participant_id', participantId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSubmission);
}

export async function fetchLatestSubmission(
  moduleId: string,
  participantId: string
): Promise<QuizSubmission | null> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('*')
    .eq('module_id', moduleId)
    .eq('participant_id', participantId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapSubmission(data) : null;
}

// ============================================================================
// Calculate Best Score (Latest Passed OR Highest)
// ============================================================================

export async function calculateBestScore(participantId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('quiz_submissions')
    .select('score, passed')
    .eq('participant_id', participantId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  // 1. Check for latest passed submission
  const latestPassed = data.find((s) => s.passed);
  if (latestPassed) return parseFloat(latestPassed.score);

  // 2. Otherwise, return highest score
  const highest = data.reduce((max, s) => {
    const score = parseFloat(s.score);
    return score > max ? score : max;
  }, 0);

  return highest;
}

// ============================================================================
// Mappers
// ============================================================================

function mapQuiz(raw: any): Quiz {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    moduleId: raw.module_id,
    passScore: parseFloat(raw.pass_score),
    timeLimitSecs: raw.time_limit_secs,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapQuestion(raw: any): QuizQuestion {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    quizId: raw.quiz_id,
    text: raw.text,
    order: raw.order,
    createdAt: raw.created_at,
  };
}

function mapOption(raw: any): QuizOption {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    questionId: raw.question_id,
    text: raw.text,
    isCorrect: raw.is_correct,
    createdAt: raw.created_at,
  };
}

function mapSubmission(raw: any): QuizSubmission {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    moduleId: raw.module_id,
    participantId: raw.participant_id,
    score: parseFloat(raw.score),
    passed: raw.passed,
    submittedAt: raw.submitted_at,
    answers: raw.answers,
  };
}
