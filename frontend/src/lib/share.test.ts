import { describe, expect, it } from 'vitest'

import { looksLikeEmail, mailtoLink, normalizePhone, whatsappLink } from './share.ts'

describe('normalizePhone', () => {
  it('prefixes a DRC national number and drops its trunk zero', () => {
    expect(normalizePhone('081 234 5678', 'CD')).toEqual({
      ok: true,
      digits: '243812345678',
      display: '+243812345678',
    })
  })

  it('keeps an international number as typed whatever the selected country', () => {
    expect(normalizePhone('+32 470 12 34 56', 'CD')).toMatchObject({ ok: true, digits: '32470123456' })
    expect(normalizePhone('0033 6 12 34 56 78', 'CD')).toMatchObject({ ok: true, digits: '33612345678' })
  })

  it('does not drop a leading zero where the national plan has no trunk prefix', () => {
    expect(normalizePhone('06 612 3456', 'CG')).toMatchObject({ ok: true, digits: '242066123456' })
  })

  it('accepts common formatting characters', () => {
    expect(normalizePhone('(081) 234-56.78', 'CD')).toMatchObject({ ok: true, digits: '243812345678' })
  })

  it('rejects letters, too short and too long numbers', () => {
    expect(normalizePhone('', 'CD')).toEqual({ ok: false, reason: 'empty' })
    expect(normalizePhone('081 abc', 'CD')).toEqual({ ok: false, reason: 'invalid_chars' })
    expect(normalizePhone('+12 34', 'CD')).toEqual({ ok: false, reason: 'too_short' })
    expect(normalizePhone('+1234567890123456', 'CD')).toEqual({ ok: false, reason: 'too_long' })
    expect(normalizePhone('+24+3', 'CD')).toEqual({ ok: false, reason: 'invalid_chars' })
  })
})

describe('whatsappLink', () => {
  it('targets the chat with the encoded message', () => {
    expect(whatsappLink('Bonjour & bienvenue\nhttps://x.test/i/abc', '243812345678')).toBe(
      'https://wa.me/243812345678?text=Bonjour%20%26%20bienvenue%0Ahttps%3A%2F%2Fx.test%2Fi%2Fabc',
    )
  })

  it('lets WhatsApp pick the contact when no number is given', () => {
    expect(whatsappLink('Salut')).toBe('https://wa.me/?text=Salut')
  })
})

describe('mailtoLink', () => {
  it('encodes spaces as %20, never «+»', () => {
    const link = mailtoLink('a@b.co', 'Invitation — Gala', 'Venez nombreux')
    expect(link).toContain('mailto:a%40b.co?subject=Invitation%20%E2%80%94%20Gala')
    expect(link).toContain('body=Venez%20nombreux')
    expect(link).not.toContain('+')
  })
})

describe('looksLikeEmail', () => {
  it('accepts plausible addresses only', () => {
    expect(looksLikeEmail('invite@example.com')).toBe(true)
    expect(looksLikeEmail('invite@example')).toBe(false)
    expect(looksLikeEmail('in vite@example.com')).toBe(false)
  })
})
