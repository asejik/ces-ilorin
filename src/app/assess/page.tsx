'use client';

import { AssessFooter, AssessHeader } from './_components/assess-header';
import { AccessGate } from './_components/access-gate';
import { ConfirmStep } from './_components/confirm-step';
import { QuizTaker } from './_components/quiz-taker';
import { SubmitConfirmModal } from './_components/submit-confirm-modal';
import { ResultCard } from './_components/result-card';
import { ACTIVE_ASSESSMENT_SESSION_KEY } from './_components/session-storage';
import { useAssessment } from './_components/use-assessment';

export default function AssessmentPortalPage() {
  const a = useAssessment();

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between">
      {/* Inline script executed synchronously before first paint to prevent flash of login gate when restoring an active quiz session */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var r=localStorage.getItem('${ACTIVE_ASSESSMENT_SESSION_KEY}');if(r){var s=JSON.parse(r);if(s&&(s.step==='taking'||s.step==='confirm')){document.documentElement.classList.add('ces-restoring-quiz');}}}catch(e){}})();`,
        }}
      />

      <AssessHeader isOnline={a.isOnline} />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {a.step === 'access' && (
          <AccessGate
            selectedCohort={a.selectedCohort}
            onCohortChange={a.setSelectedCohort}
            availableQuizzes={a.availableQuizzes}
            selectedCourse={a.selectedCourse}
            onCourseChange={a.setSelectedCourse}
            matricNo={a.matricNo}
            onMatricChange={a.setMatricNo}
            sessionPin={a.sessionPin}
            onPinChange={a.setSessionPin}
            errorMsg={a.errorMsg}
            loading={a.loading}
            onSubmit={a.handleVerifyAccess}
          />
        )}

        {a.step === 'confirm' && a.candidate && a.activeQuiz && (
          <ConfirmStep
            candidate={a.candidate}
            quiz={a.activeQuiz}
            onCancel={a.handleCancelConfirm}
            onStart={a.handleStartQuiz}
          />
        )}

        {a.step === 'taking' && a.candidate && a.activeQuiz && a.currentQuestion && (
          <QuizTaker
            candidate={a.candidate}
            quiz={a.activeQuiz}
            questions={a.questions}
            currentQuestion={a.currentQuestion}
            currentQIndex={a.currentQIndex}
            onSelectIndex={a.setCurrentQIndex}
            answers={a.answers}
            answeredCount={a.answeredCount}
            totalQuestions={a.totalQuestions}
            onSelectOption={a.handleSelectOption}
            onAbandon={a.handleAbandonQuiz}
            onReviewSubmit={() => a.setShowConfirmSubmit(true)}
          />
        )}

        {a.showConfirmSubmit && (
          <SubmitConfirmModal
            answeredCount={a.answeredCount}
            totalQuestions={a.totalQuestions}
            errorMsg={a.errorMsg}
            loading={a.loading}
            onReturn={() => a.setShowConfirmSubmit(false)}
            onConfirm={a.handleSubmitAssessment}
          />
        )}

        {a.step === 'result' && a.candidate && a.activeQuiz && (
          <ResultCard
            candidate={a.candidate}
            quiz={a.activeQuiz}
            score={a.resultScore}
            maxScore={a.resultMaxScore}
            percentage={a.resultPercentage}
            onTakeAnother={a.handleTakeAnother}
          />
        )}
      </main>

      <AssessFooter />
    </div>
  );
}
