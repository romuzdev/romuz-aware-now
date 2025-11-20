import { describe, it, expect } from 'vitest';
import type { QuizWithQuestions, QuizSubmissionPayload } from '@/types/quizzes';
import { TEST_QUIZ } from './_utils';

/**
 * Unit Tests: Quiz Grading Function
 * 
 * Tests single-choice and multi-choice quiz grading with:
 * - Correct/incorrect answers
 * - Pass threshold logic (>= pass_score)
 * - Empty/missing answers
 * - Numeric stability (round to 2 decimals)
 * - Multi-choice: exact match required (no partial credit in MVP)
 * - Order-insensitivity for multi-choice selections
 */

type QuizGradingResult = {
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
};

/**
 * Grade a quiz submission
 * 
 * @param payload - User's answers { questionId: optionId | optionId[] }
 * @param quiz - Quiz definition with questions and options
 * @returns Grading result with score (0-100), pass status, and counts
 */
function gradeQuiz(
  payload: QuizSubmissionPayload,
  quiz: QuizWithQuestions
): QuizGradingResult {
  const totalQuestions = quiz.questions.length;
  let correctAnswers = 0;

  quiz.questions.forEach((question) => {
    const answer = payload.answers[question.id];
    if (!answer) return;

    // Get all correct option IDs for this question
    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    // Handle multi-choice (array) or single-choice (string)
    if (Array.isArray(answer)) {
      // Multi-choice: must match ALL correct options exactly (no partial credit in MVP)
      const selectedSet = new Set(answer);
      const correctSet = new Set(correctOptionIds);

      // Check if sets are equal
      const isExactMatch =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((id) => correctSet.has(id));

      if (isExactMatch) {
        correctAnswers++;
      }
    } else {
      // Single-choice: check if selected option is correct
      const selectedOption = question.options.find((opt) => opt.id === answer);
      if (selectedOption?.isCorrect) {
        correctAnswers++;
      }
    }
  });

  const score =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const passed = score >= quiz.passScore;

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    passed,
    totalQuestions,
    correctAnswers,
  };
}

describe('Quiz Grading: Basic Scoring', () => {
  it('should grade all correct answers as 100%', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt1', // Correct
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(2);
  });

  it('should grade all incorrect answers as 0%', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt1', // Incorrect
        q2: 'q2-opt2', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(0);
  });

  it('should grade partial correct answers', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt2', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false); // passScore = 70
    expect(result.totalQuestions).toBe(2);
    expect(result.correctAnswers).toBe(1);
  });
});

describe('Quiz Grading: Pass Threshold', () => {
  it('should pass when score >= passScore', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 70,
      questions: [
        TEST_QUIZ.questions[0],
        TEST_QUIZ.questions[1],
        {
          ...TEST_QUIZ.questions[0],
          id: 'q3',
          text: 'Third question',
        },
      ],
    };

    // 2 correct out of 3 = 66.67% (fail)
    const payload1: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt1', // Correct
        q3: 'q1-opt1', // Incorrect
      },
    };

    const result1 = gradeQuiz(payload1, quiz);
    expect(result1.score).toBe(66.67);
    expect(result1.passed).toBe(false);

    // 3 correct out of 3 = 100% (pass)
    const payload2: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt1', // Correct
        q3: 'q1-opt2', // Correct
      },
    };

    const result2 = gradeQuiz(payload2, quiz);
    expect(result2.score).toBe(100);
    expect(result2.passed).toBe(true);
  });

  it('should pass at exact threshold', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 50,
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct (50%)
        q2: 'q2-opt2', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(50);
    expect(result.passed).toBe(true); // >= 50
  });

  it('should fail just below threshold', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 51,
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct (50%)
        q2: 'q2-opt2', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false); // < 51
  });
});

describe('Quiz Grading: Empty/Missing Answers', () => {
  it('should handle empty answers object', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {},
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.correctAnswers).toBe(0);
  });

  it('should handle partially missing answers', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        // q2 missing
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(50); // 1 correct out of 2
    expect(result.correctAnswers).toBe(1);
  });

  it('should handle invalid option IDs', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'invalid-option-id',
        q2: 'q2-opt1', // Correct
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(50); // 1 correct out of 2
    expect(result.correctAnswers).toBe(1);
  });
});

describe('Quiz Grading: Numeric Stability', () => {
  it('should round score to 2 decimal places', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 70,
      questions: [
        TEST_QUIZ.questions[0],
        TEST_QUIZ.questions[1],
        {
          ...TEST_QUIZ.questions[0],
          id: 'q3',
          text: 'Third question',
        },
      ],
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt2', // Incorrect
        q3: 'q1-opt1', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(33.33); // 1/3 = 0.333... rounded to 33.33
    expect(result.score.toString()).toMatch(/^\d+\.\d{2}$/);
  });

  it('should handle perfect division (no rounding needed)', () => {
    const quiz = TEST_QUIZ;

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt1', // Correct
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(100.0);
  });

  it('should handle zero questions gracefully', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      questions: [],
    };

    const payload: QuizSubmissionPayload = {
      answers: {},
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.totalQuestions).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });
});

describe('Quiz Grading: Edge Cases', () => {
  it('should handle single-question quiz', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 100,
      questions: [TEST_QUIZ.questions[0]],
    };

    const payloadPass: QuizSubmissionPayload = {
      answers: { q1: 'q1-opt2' },
    };

    const resultPass = gradeQuiz(payloadPass, quiz);
    expect(resultPass.score).toBe(100);
    expect(resultPass.passed).toBe(true);

    const payloadFail: QuizSubmissionPayload = {
      answers: { q1: 'q1-opt1' },
    };

    const resultFail = gradeQuiz(payloadFail, quiz);
    expect(resultFail.score).toBe(0);
    expect(resultFail.passed).toBe(false);
  });

  it('should handle question with no correct option', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      questions: [
        {
          id: 'q1',
          tenantId: 'tenant-1',
          quizId: 'quiz-1',
          text: 'No correct answer',
          order: 1,
          createdAt: '2024-01-01',
          options: [
            {
              id: 'opt1',
              tenantId: 'tenant-1',
              questionId: 'q1',
              text: 'Wrong 1',
              isCorrect: false,
              createdAt: '2024-01-01',
            },
            {
              id: 'opt2',
              tenantId: 'tenant-1',
              questionId: 'q1',
              text: 'Wrong 2',
              isCorrect: false,
              createdAt: '2024-01-01',
            },
          ],
        },
      ],
    };

    const payload: QuizSubmissionPayload = {
      answers: { q1: 'opt1' },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(0);
    expect(result.correctAnswers).toBe(0);
  });

  it('should handle passScore of 0 (always pass)', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 0,
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt1', // Incorrect
        q2: 'q2-opt2', // Incorrect
      },
    };

    const result = gradeQuiz(payload, quiz);

    expect(result.score).toBe(0);
    expect(result.passed).toBe(true); // >= 0
  });

  it('should handle passScore of 100 (only perfect pass)', () => {
    const quiz: QuizWithQuestions = {
      ...TEST_QUIZ,
      passScore: 100,
    };

    const payloadPartial: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt2', // Incorrect
      },
    };

    const resultPartial = gradeQuiz(payloadPartial, quiz);
    expect(resultPartial.score).toBe(50);
    expect(resultPartial.passed).toBe(false);

    const payloadPerfect: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Correct
        q2: 'q2-opt1', // Correct
      },
    };

    const resultPerfect = gradeQuiz(payloadPerfect, quiz);
    expect(resultPerfect.score).toBe(100);
    expect(resultPerfect.passed).toBe(true);
  });
});

describe('Quiz Grading: Multi-Choice Questions', () => {
  // Multi-choice quiz with 2 questions
  const multiChoiceQuiz: QuizWithQuestions = {
    id: 'multi-quiz-1',
    tenantId: 'tenant-1',
    moduleId: 'module-1',
    passScore: 70,
    timeLimitSecs: 300,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    questions: [
      {
        id: 'mc-q1',
        tenantId: 'tenant-1',
        quizId: 'multi-quiz-1',
        text: 'Select all primary colors',
        order: 1,
        createdAt: '2024-01-01T00:00:00Z',
        options: [
          {
            id: 'mc-q1-opt1',
            tenantId: 'tenant-1',
            questionId: 'mc-q1',
            text: 'Red',
            isCorrect: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q1-opt2',
            tenantId: 'tenant-1',
            questionId: 'mc-q1',
            text: 'Blue',
            isCorrect: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q1-opt3',
            tenantId: 'tenant-1',
            questionId: 'mc-q1',
            text: 'Yellow',
            isCorrect: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q1-opt4',
            tenantId: 'tenant-1',
            questionId: 'mc-q1',
            text: 'Green',
            isCorrect: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q1-opt5',
            tenantId: 'tenant-1',
            questionId: 'mc-q1',
            text: 'Purple',
            isCorrect: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
      {
        id: 'mc-q2',
        tenantId: 'tenant-1',
        quizId: 'multi-quiz-1',
        text: 'Select all even numbers',
        order: 2,
        createdAt: '2024-01-01T00:00:00Z',
        options: [
          {
            id: 'mc-q2-opt1',
            tenantId: 'tenant-1',
            questionId: 'mc-q2',
            text: '2',
            isCorrect: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q2-opt2',
            tenantId: 'tenant-1',
            questionId: 'mc-q2',
            text: '4',
            isCorrect: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q2-opt3',
            tenantId: 'tenant-1',
            questionId: 'mc-q2',
            text: '3',
            isCorrect: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'mc-q2-opt4',
            tenantId: 'tenant-1',
            questionId: 'mc-q2',
            text: '5',
            isCorrect: false,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      },
    ],
  };

  it('should award full score when all correct options selected', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // All 3 correct
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // All 2 correct
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.correctAnswers).toBe(2);
    expect(result.totalQuestions).toBe(2);
  });

  it('should award zero for partial-correct (missing one correct option)', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2'], // Missing Yellow (partial)
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // All correct
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    expect(result.score).toBe(50); // Only q2 correct
    expect(result.correctAnswers).toBe(1);
    expect(result.passed).toBe(false); // < 70%
  });

  it('should award zero when including a wrong option', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3', 'mc-q1-opt4'], // Includes Green (wrong)
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // All correct
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    expect(result.score).toBe(50); // Only q2 correct
    expect(result.correctAnswers).toBe(1);
    expect(result.passed).toBe(false);
  });

  it('should award zero for empty answer array', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': [], // Empty
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // Correct
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    expect(result.score).toBe(50); // Only q2 correct
    expect(result.correctAnswers).toBe(1);
  });

  it('should award zero when answer is missing entirely', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        // mc-q1 missing
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // Correct
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    expect(result.score).toBe(50); // Only q2 correct
    expect(result.correctAnswers).toBe(1);
  });

  it('should be order-insensitive (same score regardless of selection order)', () => {
    const payload1: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // Order: 1, 2, 3
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'], // Order: 1, 2
      },
    };

    const payload2: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt3', 'mc-q1-opt1', 'mc-q1-opt2'], // Order: 3, 1, 2
        'mc-q2': ['mc-q2-opt2', 'mc-q2-opt1'], // Order: 2, 1
      },
    };

    const result1 = gradeQuiz(payload1, multiChoiceQuiz);
    const result2 = gradeQuiz(payload2, multiChoiceQuiz);

    expect(result1.score).toBe(100);
    expect(result2.score).toBe(100);
    expect(result1.correctAnswers).toBe(result2.correctAnswers);
  });

  it('should handle mixed single-choice and multi-choice in same quiz', () => {
    const mixedQuiz: QuizWithQuestions = {
      ...multiChoiceQuiz,
      questions: [
        // Single-choice question
        TEST_QUIZ.questions[0],
        // Multi-choice question
        multiChoiceQuiz.questions[0],
      ],
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        q1: 'q1-opt2', // Single-choice: correct
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // Multi-choice: all correct
      },
    };

    const result = gradeQuiz(payload, mixedQuiz);

    expect(result.score).toBe(100);
    expect(result.correctAnswers).toBe(2);
    expect(result.passed).toBe(true);
  });

  it('should round multi-choice scores to 2 decimals', () => {
    const threeQuestionQuiz: QuizWithQuestions = {
      ...multiChoiceQuiz,
      questions: [
        multiChoiceQuiz.questions[0],
        multiChoiceQuiz.questions[1],
        TEST_QUIZ.questions[0],
      ],
    };

    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // Correct
        'mc-q2': ['mc-q2-opt1'], // Partial (missing opt2) → zero
        q1: 'q1-opt1', // Incorrect
      },
    };

    const result = gradeQuiz(payload, threeQuestionQuiz);

    expect(result.score).toBe(33.33); // 1/3 = 0.3333... → 33.33
    expect(result.correctAnswers).toBe(1);
  });

  it('should enforce pass threshold with multi-choice questions', () => {
    const strictQuiz: QuizWithQuestions = {
      ...multiChoiceQuiz,
      passScore: 100, // Must get both questions perfect
    };

    const payloadPartial: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // Correct
        'mc-q2': ['mc-q2-opt1'], // Partial → zero
      },
    };

    const result = gradeQuiz(payloadPartial, strictQuiz);

    expect(result.score).toBe(50);
    expect(result.passed).toBe(false); // < 100

    const payloadPerfect: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'],
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'],
      },
    };

    const resultPerfect = gradeQuiz(payloadPerfect, strictQuiz);

    expect(resultPerfect.score).toBe(100);
    expect(resultPerfect.passed).toBe(true);
  });

  it('should handle duplicate selections gracefully (Set deduplication)', () => {
    const payload: QuizSubmissionPayload = {
      answers: {
        'mc-q1': ['mc-q1-opt1', 'mc-q1-opt1', 'mc-q1-opt2', 'mc-q1-opt3'], // Duplicate opt1
        'mc-q2': ['mc-q2-opt1', 'mc-q2-opt2'],
      },
    };

    const result = gradeQuiz(payload, multiChoiceQuiz);

    // Set deduplication should still match correct answer
    expect(result.score).toBe(100);
    expect(result.correctAnswers).toBe(2);
  });
});
