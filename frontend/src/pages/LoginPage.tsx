import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import { Alert, BrandLockup, Button, Field, Input, LogoMark, PasswordInput } from '../design-system/index.ts'
import { ApiError } from '../lib/api.ts'
import { fr } from '../locales/fr.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CURRENT_YEAR = new Date().getFullYear()

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/accueil'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to={from} replace />
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!email.trim()) {
      errors.email = fr.common.requiredField
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = fr.common.invalidEmail
    }
    if (!password) {
      errors.password = fr.common.requiredField
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
      await login({ email: email.trim(), password })
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
          <LogoMark className="h-40 w-40 rounded-2xl xl:h-48 xl:w-48" />
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
            {fr.login.title}
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">{fr.login.subtitle}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {formError ? <Alert tone="danger">{formError}</Alert> : null}

            <Field
              id="login-email"
              label={fr.login.email}
              required
              error={fieldErrors.email}
            >
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
            </Field>

            <Field
              id="login-password"
              label={fr.login.password}
              required
              error={fieldErrors.password}
            >
              <PasswordInput
                id="login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
            </Field>

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? fr.login.submitting : fr.login.submit}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
