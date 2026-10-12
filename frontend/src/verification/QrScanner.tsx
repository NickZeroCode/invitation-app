import { useEffect, useRef, useState, type FormEvent } from 'react'
import jsQR from 'jsqr'
import { Button, IconQr, Input, Spinner } from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'

type QrScannerProps = {
  /** Called once per decoded QR payload (or on manual submission). */
  onResult: (content: string) => void
  /** While the server verifies a scan, decoding and input pause. */
  verifying?: boolean
}

/**
 * Door-side QR reader: rear camera + jsQR decoding, with a manual entry
 * fallback that always works (no camera, denied permission, desktop).
 *
 * The camera stream never leaves the device — only the decoded text is sent
 * to the server for the verdict. The scan loop is created once and reads its
 * callbacks through refs so live frames are never dropped to re-renders.
 */
export function QrScanner({ onResult, verifying = false }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const decodingRef = useRef(false)
  const emittedRef = useRef(false)
  const onResultRef = useRef(onResult)
  const verifyingRef = useRef(verifying)
  const [cameraState, setCameraState] = useState<'starting' | 'live' | 'unavailable'>(() =>
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? 'starting'
      : 'unavailable',
  )
  const [manual, setManual] = useState('')

  useEffect(() => {
    onResultRef.current = onResult
    verifyingRef.current = verifying
  })

  useEffect(() => {
    function stopCamera() {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop()
        streamRef.current = null
      }
      decodingRef.current = false
    }

    const mediaDevices = navigator.mediaDevices
    if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
      return stopCamera
    }

    let cancelled = false
    mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop()
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          void video.play().catch(() => undefined)
        }
        setCameraState('live')
        tick()
      })
      .catch(() => {
        if (!cancelled) setCameraState('unavailable')
      })

    function tick() {
      rafRef.current = window.requestAnimationFrame(tick)
      if (verifyingRef.current || decodingRef.current || emittedRef.current) return
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return
      const width = video.videoWidth
      const height = video.videoHeight
      if (!width || !height) return

      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return
      context.drawImage(video, 0, 0, width, height)
      const frame = context.getImageData(0, 0, width, height)

      decodingRef.current = true
      let decoded: string | null = null
      try {
        decoded = jsQR(frame.data, frame.width, frame.height)?.data ?? null
      } catch {
        decoded = null
      } finally {
        decodingRef.current = false
      }
      if (decoded && decoded.trim()) {
        emittedRef.current = true
        stopCamera()
        onResultRef.current(decoded.trim())
      }
    }

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [])

  function submitManual(event: FormEvent) {
    event.preventDefault()
    const value = manual.trim()
    if (!value || verifying) return
    emittedRef.current = true
    onResult(value)
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-ink">
        {/* Always mounted so the stream can attach the moment it is granted:
            the ref must exist before setCameraState('live') renders the feed. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-label={fr.verify.scanner.title}
        />
        {cameraState !== 'live' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white/80">
            {cameraState === 'starting' ? (
              <>
                <Spinner className="h-6 w-6 text-white/70" />
                <p className="text-sm">{fr.verify.scanner.starting}</p>
              </>
            ) : (
              <>
                <IconQr className="h-10 w-10 text-white/60" />
                <p className="text-sm leading-relaxed text-white/75">{fr.verify.scanner.cameraError}</p>
              </>
            )}
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/25" />
      </div>

      <form onSubmit={submitManual} className="space-y-2">
        <label className="block text-sm font-semibold text-ink" htmlFor="manual-qr-input">
          {fr.verify.scanner.manualLabel}
        </label>
        <div className="flex gap-2">
          <Input
            id="manual-qr-input"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder={fr.verify.scanner.manualPlaceholder}
            autoComplete="off"
            disabled={verifying}
          />
          <Button type="submit" variant="secondary" disabled={verifying || !manual.trim()}>
            {fr.verify.scanner.manualSubmit}
          </Button>
        </div>
      </form>
    </div>
  )
}
