import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '../auth/AuthContext.tsx'
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  PasswordInput,
  Select,
} from '../design-system/index.ts'
import { ApiError, authApi } from '../lib/api.ts'
import { fr } from '../locales/fr.ts'

const COMMON_TIMEZONES = [
  'Africa/Kinshasa',
  'Africa/Lubumbashi',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Europe/Paris',
  'UTC',
]

interface FieldErrors {
  [key: string]: string
}

function mapApiErrors(error: unknown): { formError: string | null; fieldErrors: FieldErrors } {
  if (error instanceof ApiError) {
    const fieldErrors: FieldErrors = {}
    let formError: string | null = null
    for (const [key, messages] of Object.entries(error.fields)) {
      if (key === 'non_field_errors') {
        formError = messages[0] ?? fr.common.unexpectedError
      } else {
        fieldErrors[key] = messages[0] ?? fr.common.unexpectedError
      }
    }
    if (Object.keys(fieldErrors).length === 0 && formError === null) {
      formError = error.message || fr.common.unexpectedError
    }
    return { formError, fieldErrors }
  }
  return { formError: fr.common.unexpectedError, fieldErrors: {} }
}

export function SettingsPage() {
  const { user, refreshUser, markAnonymous } = useAuth()
  const queryClient = useQueryClient()

  // --- Profile form ---
  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Africa/Kinshasa')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileFormError, setProfileFormError] = useState<string | null>(null)
  const [profileErrors, setProfileErrors] = useState<FieldErrors>({})

  // --- Password form ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null)
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors>({})

  const timezoneOptions = COMMON_TIMEZONES.includes(timezone)
    ? COMMON_TIMEZONES
    : [timezone, ...COMMON_TIMEZONES]

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    setProfileSuccess(false)
    setProfileFormError(null)
    setProfileErrors({})

    setProfileSaving(true)
    try {
      await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        timezone,
      })
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'overview'] })
      setProfileSuccess(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        markAnonymous()
        return
      }
      const mapped = mapApiErrors(error)
      setProfileFormError(mapped.formError)
      setProfileErrors(mapped.fieldErrors)
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordSuccess(false)
    setPasswordFormError(null)
    setPasswordErrors({})

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirm_password: fr.settings.password.mismatch })
      return
    }

    setPasswordSaving(true)
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        markAnonymous()
        return
      }
      const mapped = mapApiErrors(error)
      setPasswordFormError(mapped.formError)
      setPasswordErrors(mapped.fieldErrors)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{fr.settings.title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{fr.settings.subtitle}</p>
      </header>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader
            title={fr.settings.profile.title}
            description={fr.settings.profile.description}
          />
          <CardBody>
            <form onSubmit={handleProfileSubmit} noValidate className="max-w-md space-y-5">
              {profileSuccess ? <Alert tone="success">{fr.settings.profile.success}</Alert> : null}
              {profileFormError ? <Alert tone="danger">{profileFormError}</Alert> : null}

              <Field id="profile-first-name" label={fr.settings.profile.firstName} error={profileErrors.first_name}>
                <Input
                  id="profile-first-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  invalid={Boolean(profileErrors.first_name)}
                />
              </Field>

              <Field id="profile-last-name" label={fr.settings.profile.lastName} error={profileErrors.last_name}>
                <Input
                  id="profile-last-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  invalid={Boolean(profileErrors.last_name)}
                />
              </Field>

              <Field
                id="profile-timezone"
                label={fr.settings.profile.timezone}
                hint={fr.settings.profile.timezoneHint}
                error={profileErrors.timezone}
              >
                <Select
                  id="profile-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  invalid={Boolean(profileErrors.timezone)}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>
              </Field>

              <Button type="submit" loading={profileSaving}>
                {fr.settings.profile.submit}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={fr.settings.password.title}
            description={fr.settings.password.description}
          />
          <CardBody>
            <form onSubmit={handlePasswordSubmit} noValidate className="max-w-md space-y-5">
              {passwordSuccess ? <Alert tone="success">{fr.settings.password.success}</Alert> : null}
              {passwordFormError ? <Alert tone="danger">{passwordFormError}</Alert> : null}

              <Field
                id="password-current"
                label={fr.settings.password.current}
                required
                error={passwordErrors.current_password}
              >
                <PasswordInput
                  id="password-current"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  invalid={Boolean(passwordErrors.current_password)}
                />
              </Field>

              <Field
                id="password-new"
                label={fr.settings.password.new}
                required
                error={passwordErrors.new_password}
              >
                <PasswordInput
                  id="password-new"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  invalid={Boolean(passwordErrors.new_password)}
                />
              </Field>

              <Field
                id="password-confirm"
                label={fr.settings.password.confirm}
                required
                error={passwordErrors.confirm_password}
              >
                <PasswordInput
                  id="password-confirm"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  invalid={Boolean(passwordErrors.confirm_password)}
                />
              </Field>

              <Button type="submit" loading={passwordSaving}>
                {fr.settings.password.submit}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
