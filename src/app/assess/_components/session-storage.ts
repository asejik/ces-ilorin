export const ACTIVE_ASSESSMENT_SESSION_KEY = 'ces_active_assessment_session';

export function clearActiveAssessmentSession(matricNo?: string, quizId?: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_ASSESSMENT_SESSION_KEY);
    document.documentElement.classList.remove('ces-restoring-quiz');
    if (matricNo && quizId) {
      localStorage.removeItem(`ces_quiz_draft_${matricNo}_${quizId}`);
    }
  } catch {
    // ignore
  }
}
