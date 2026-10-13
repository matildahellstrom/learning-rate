import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { gameStore } from '../../app/game'
import { t } from '../../i18n'
import { useLesson } from '../../lesson/context'
import { checkAnswer, formatAnswer } from './check'
import styles from './Quiz.module.css'

/** Renders the quiz from the lesson's frontmatter, one question at a time. */
export function Quiz() {
  const { lesson, quizAttempt, recordQuizAnswer } = useLesson()
  const questions = lesson.quiz
  // Resume where this attempt left off if the player navigates away and back.
  const [index, setIndex] = useState(() => Object.keys(quizAttempt).length)
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef<HTMLParagraphElement>(null)
  const counterRef = useRef<HTMLParagraphElement>(null)
  const isFirstRender = useRef(true)
  const [justFinished, setJustFinished] = useState(false)
  const ids = useId()

  // After checking, move focus to "Next" so keyboard users can carry on immediately.
  useEffect(() => {
    if (feedback !== null) nextRef.current?.focus()
  }, [feedback])

  // A new question: the "Next" button that had focus is gone, so move focus to the top of the
  // new question (not on first render, and the done state handles its own focus below).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    counterRef.current?.focus()
  }, [index])

  // The "Next" button disappears after the last question; keep focus on the result instead.
  useEffect(() => {
    if (justFinished) doneRef.current?.focus()
  }, [justFinished])

  if (questions.length === 0) return <p>{t('quiz.empty')}</p>

  if (index >= questions.length) {
    const correct = Object.values(quizAttempt).filter(Boolean).length
    return (
      <p ref={doneRef} tabIndex={-1} className={styles.done}>
        <span aria-hidden="true">🎉 </span>
        {t('quiz.done', { correct, total: questions.length })}
      </p>
    )
  }

  const question = questions[index]
  const answered = feedback !== null

  function submit(event: FormEvent) {
    event.preventDefault()
    if (answered) return
    const result = checkAnswer(question, question.type === 'choice' ? (choice ?? -1) : text)
    if (!result.valid) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    setFeedback(result.correct)
    recordQuizAnswer(index, result.correct)
    gameStore.dispatch({
      type: 'quizAnswered',
      lessonId: lesson.id,
      questionIndex: index,
      correct: result.correct,
    })
  }

  function next() {
    setIndex(index + 1)
    setJustFinished(index + 1 >= questions.length)
    setChoice(null)
    setText('')
    setFeedback(null)
  }

  return (
    <form className={styles.quiz} onSubmit={submit}>
      <p ref={counterRef} tabIndex={-1} className={styles.counter}>
        {t('quiz.question', { n: index + 1, total: questions.length })}
      </p>

      {question.type === 'choice' ? (
        <fieldset className={styles.fieldset} disabled={answered}>
          <legend className={styles.prompt}>{question.prompt}</legend>
          {question.options.map((option, i) => {
            const state = !answered
              ? ''
              : i === question.answer
                ? styles.correct
                : i === choice
                  ? styles.wrong
                  : ''
            return (
              <label key={option} className={`${styles.option} ${state}`}>
                <input
                  type="radio"
                  name={`${ids}-q${index}`}
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                />
                <span>{option}</span>
                {answered && i === question.answer && (
                  <span className={styles.mark} aria-hidden="true">
                    ✓
                  </span>
                )}
                {answered && i === choice && i !== question.answer && (
                  <span className={styles.mark} aria-hidden="true">
                    ✗
                  </span>
                )}
              </label>
            )
          })}
        </fieldset>
      ) : (
        <div className={styles.fieldset}>
          <p className={styles.prompt} id={`${ids}-prompt`}>
            {question.prompt}
          </p>
          <label className={styles.numericLabel} htmlFor={`${ids}-input`}>
            {t('quiz.numericLabel')}
          </label>
          <input
            id={`${ids}-input`}
            className={styles.numeric}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            disabled={answered}
            aria-invalid={invalid}
            aria-describedby={`${ids}-prompt ${invalid ? `${ids}-error` : ''}`}
            onChange={(e) => setText(e.target.value)}
          />
          {invalid && (
            <p id={`${ids}-error`} className={styles.error}>
              {t('quiz.invalidNumber')}
            </p>
          )}
        </div>
      )}

      <div aria-live="polite">
        {answered && (
          <div
            className={`${styles.feedback} ${feedback ? styles.feedbackGood : styles.feedbackBad}`}
          >
            <p className={styles.verdict}>
              <span aria-hidden="true">{feedback ? '✅ ' : '💡 '}</span>
              {feedback ? t('quiz.correct') : t('quiz.incorrect')}
            </p>
            {!feedback && <p>{t('quiz.answerWas', { answer: formatAnswer(question) })}</p>}
            <p>{question.explanation}</p>
          </div>
        )}
      </div>

      {answered ? (
        // Distinct keys: React must not reuse the "Next" button's DOM node (and its focus) for
        // "Check", which starts out disabled.
        <button key="next" ref={nextRef} type="button" className="btn btn-go" onClick={next}>
          {t('quiz.next')}
        </button>
      ) : (
        <button
          key="check"
          type="submit"
          className="btn btn-go"
          disabled={question.type === 'choice' ? choice === null : text.trim() === ''}
        >
          {t('quiz.check')}
        </button>
      )}
    </form>
  )
}
