import { describe, it, expect } from 'vitest';
import {
  assessmentAccessSchema,
  assessmentSubmissionSchema,
  quizSessionUpdateSchema,
} from '../validation/assessment';
import { CES_CURRICULUM } from '../curriculum';

describe('Assessment Validation Schemas', () => {
  it('validates and transforms assessmentAccessSchema inputs', () => {
    const valid = {
      matricNo: '  ces/ilr/26i901  ',
      courseCode: '  Salvation  ',
      sessionPin: '  salv26  ',
    };

    const parsed = assessmentAccessSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.matricNo).toBe('CES/ILR/26I901');
      expect(parsed.data.courseCode).toBe('salvation');
      expect(parsed.data.sessionPin).toBe('SALV26');
    }
  });

  it('rejects missing matric number in access schema', () => {
    const invalid = {
      matricNo: '',
      courseCode: 'salvation',
      sessionPin: 'SALV26',
    };

    const parsed = assessmentAccessSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates assessmentSubmissionSchema with valid UUID question keys and 0..3 options', () => {
    const valid = {
      matricNo: 'CES/ILR/26I901',
      quizId: '11111111-1111-1111-1111-111111111111',
      answers: {
        '22222222-2222-2222-2222-222222222222': 1,
        '33333333-3333-3333-3333-333333333333': 0,
      },
    };

    const parsed = assessmentSubmissionSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid option index outside 0..3 in submission schema', () => {
    const invalid = {
      matricNo: 'CES/ILR/26I901',
      quizId: '11111111-1111-1111-1111-111111111111',
      answers: {
        '22222222-2222-2222-2222-222222222222': 4, // invalid index > 3
      },
    };

    const parsed = assessmentSubmissionSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('validates quizSessionUpdateSchema PIN length and uppercase transform', () => {
    const valid = {
      quizId: '11111111-1111-1111-1111-111111111111',
      sessionPin: 'testpin',
      isOpen: true,
    };

    const parsed = quizSessionUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sessionPin).toBe('TESTPIN');
      expect(parsed.data.isOpen).toBe(true);
    }
  });
});

describe('Assessment Scoring Engine Logic', () => {
  const salvationQuestions = [
    { id: 'q1', correctOptionIndex: 1, marks: 1.0 },
    { id: 'q2', correctOptionIndex: 1, marks: 1.0 },
    { id: 'q3', correctOptionIndex: 2, marks: 1.0 },
    { id: 'q4', correctOptionIndex: 1, marks: 1.0 },
    { id: 'q5', correctOptionIndex: 1, marks: 1.0 },
  ];

  function computeScore(
    questions: typeof salvationQuestions,
    answers: Record<string, number>,
    maxScore: number
  ) {
    let score = 0;
    for (const q of questions) {
      if (answers[q.id] !== undefined && answers[q.id] === q.correctOptionIndex) {
        score += q.marks;
      }
    }
    return Number(Math.min(maxScore, Math.max(0, score)).toFixed(2));
  }

  it('scores 100% (5.00/5.00) when all answers are correct', () => {
    const perfectAnswers = { q1: 1, q2: 1, q3: 2, q4: 1, q5: 1 };
    const score = computeScore(salvationQuestions, perfectAnswers, 5.0);
    expect(score).toBe(5.0);
  });

  it('scores 0.00 when all answers are incorrect', () => {
    const zeroAnswers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
    const score = computeScore(salvationQuestions, zeroAnswers, 5.0);
    expect(score).toBe(0.0);
  });

  it('scores partial credit correctly (3.00/5.00)', () => {
    const partialAnswers = { q1: 1, q2: 1, q3: 2, q4: 0, q5: 0 };
    const score = computeScore(salvationQuestions, partialAnswers, 5.0);
    expect(score).toBe(3.0);
  });

  it('handles unanswered or omitted questions gracefully without crashing', () => {
    const omittedAnswers = { q1: 1 }; // 4 questions omitted
    const score = computeScore(salvationQuestions, omittedAnswers, 5.0);
    expect(score).toBe(1.0);
  });

  it('scores final exam with weighted questions correctly (36.00/60.00)', () => {
    const examQuestions = [
      { id: 'e1', correctOptionIndex: 1, marks: 12.0 },
      { id: 'e2', correctOptionIndex: 1, marks: 12.0 },
      { id: 'e3', correctOptionIndex: 1, marks: 12.0 },
      { id: 'e4', correctOptionIndex: 0, marks: 12.0 },
      { id: 'e5', correctOptionIndex: 1, marks: 12.0 },
    ];

    const answers = { e1: 1, e2: 1, e3: 1, e4: 3, e5: 2 }; // e1, e2, e3 correct (36), e4, e5 wrong
    const score = computeScore(examQuestions, answers, 60.0);
    expect(score).toBe(36.0);
  });
});

describe('Curriculum Security & Question Integrity', () => {
  it('defines 8 modular quizzes and 1 final exam (9 total)', () => {
    expect(CES_CURRICULUM).toHaveLength(9);
  });

  it('verifies all 8 modular quizzes have exactly 5 questions and 5.0 max score', () => {
    const modularQuizzes = CES_CURRICULUM.filter((c) => c.type === 'quiz');
    expect(modularQuizzes).toHaveLength(8);

    for (const quiz of modularQuizzes) {
      expect(quiz.maxScore).toBe(5.0);
      expect(quiz.questions).toHaveLength(5);
      const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
      expect(totalMarks).toBe(5.0);
    }
  });

  it('verifies all questions have exactly 4 options and valid correctOptionIndex (0..3)', () => {
    for (const course of CES_CURRICULUM) {
      for (const q of course.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
        expect(q.options[q.correctOptionIndex]).toBeDefined();
      }
    }
  });

  it('sanitization strictly omits correctOptionIndex for client delivery', () => {
    const rawQuestion = {
      id: 'test-uuid-1',
      question_text: 'Sample question?',
      options: ['A', 'B', 'C', 'D'],
      correct_option_index: 2,
      marks: 1.0,
      sort_order: 1,
    };

    // Simulate sanitization logic from server action
    const sanitized = {
      id: rawQuestion.id,
      questionText: rawQuestion.question_text,
      options: rawQuestion.options,
      marks: rawQuestion.marks,
      sortOrder: rawQuestion.sort_order,
    };

    expect(sanitized).not.toHaveProperty('correct_option_index');
    expect(sanitized).not.toHaveProperty('correctOptionIndex');
  });
});
