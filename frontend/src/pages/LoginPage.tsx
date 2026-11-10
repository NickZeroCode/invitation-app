import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/AuthContext.tsx'
import { Alert, Button, Field, Input, PasswordInput } from '../design-system/index.ts'
import { AuthLayout } from '../layout/AuthLayout.tsx'
import { ApiError } from '../lib/api.ts'
import { fr } from '../locales/fr.ts'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    <AuthLayout title={fr.login.title} subtitle={fr.login.subtitle}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
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

      <p className="mt-6 text-center text-sm text-ink-soft">
        {fr.login.noAccount}{' '}
        <Link to="/inscription" className="text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
          {fr.login.createAccount}
        </Link>
      </p>
    </AuthLayout>
  )
}
