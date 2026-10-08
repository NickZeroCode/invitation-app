import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import { Alert, BrandLockup, Button, Field, Input, LogoMark, PasswordInput } from '../design-system/index.ts'
import { ApiError } from '../lib/api.ts'
import { fr } from '../locales/fr.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CURRENT_YEAR = new Date().getFullYear()
const MIN_PASSWORD_LENGTH = 8

export function SignupPage() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/accueil'

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) {
      errors.first_name = fr.common.requiredField
    }
    if (!lastName.trim()) {
      errors.last_name = fr.common.requiredField
    }
    if (!email.trim()) {
      errors.email = fr.common.requiredField
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = fr.common.invalidEmail
    }
    if (!password) {
      errors.password = fr.common.requiredField
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = fr.signup.passwordTooShort
    }
    if (!confirmPassword) {
      errors.confirm_password = fr.common.requiredField
    } else if (confirmPassword !== password) {
      errors.confirm_password = fr.signup.passwordMismatch
    }
    return errors
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      await register({
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.fields)) {
          if (key === 'non_field_errors') {
            setFormError(messages[0] ?? fr.common.unexpectedError)
          } else {
            mapped[key] = messages[0] ?? fr.common.unexpectedError
          }
        }
        setFieldErrors(mapped)
        if (Object.keys(mapped).length === 0) {
          setFormError(error.message || fr.common.unexpectedError)
        }
      } else {
        setFormError(fr.common.unexpectedError)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh bg-paper">
      {/* Brand panel */}
      <aside className="hidden w-[42%] max-w-xl flex-col justify-between bg-ink px-12 py-10 text-white lg:flex">
        <div className="flex justify-center">
          <LogoMark plate={false} className="h-28 w-28 xl:h-32 xl:w-32" />
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight">{fr.login.heroTitle}</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{fr.login.heroText}</p>
          <ul className="mt-8 space-y-2.5">
            {[fr.login.heroPoint1, fr.login.heroPoint2, fr.login.heroPoint3].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/85">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-pill bg-white/60" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/50">
          © {CURRENT_YEAR} {fr.appName}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center lg:hidden">
            <BrandLockup />
          </div>

          <h2 className="mt-8 text-2xl font-semibold tracking-tight text-ink lg:mt-0">
            {fr.signup.title}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">{fr.signup.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {formError ? <Alert tone="danger">{formError}</Alert> : null}

            <div className="grid grid-cols-2 gap-4">
              <Field
                id="signup-first-name"
                label={fr.signup.firstName}
                required
                error={fieldErrors.first_name}
              >
                <Input
                  id="signup-first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  invalid={Boolean(fieldErrors.first_name)}
                  aria-describedby={fieldErrors.first_name ? 'signup-first-name-error' : undefined}
                />
              </Field>

              <Field
                id="signup-last-name"
                label={fr.signup.lastName}
                required
                error={fieldErrors.last_name}
              >
                <Input
                  id="signup-last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  invalid={Boolean(fieldErrors.last_name)}
                  aria-describedby={fieldErrors.last_name ? 'signup-last-name-error' : undefined}
                />
              </Field>
            </div>

            <Field id="signup-email" label={fr.signup.email} required error={fieldErrors.email}>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
              />
            </Field>

            <Field id="signup-password" label={fr.signup.password} required error={fieldErrors.password}>
              <PasswordInput
                id="signup-password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
              />
            </Field>

            <Field
              id="signup-confirm-password"
              label={fr.signup.confirmPassword}
              required
              error={fieldErrors.confirm_password}
            >
              <PasswordInput
                id="signup-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                invalid={Boolean(fieldErrors.confirm_password)}
                aria-describedby={
                  fieldErrors.confirm_password ? 'signup-confirm-password-error' : undefined
                }
              />
            </Field>

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? fr.signup.submitting : fr.signup.submit}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-soft">
            {fr.signup.haveAccount}{' '}
            <Link
              to="/connexion"
              className="font-semibold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:text-brand"
            >
              {fr.signup.signIn}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
