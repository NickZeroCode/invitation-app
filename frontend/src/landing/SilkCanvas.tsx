/**
 * Flowing ink-and-gold satin behind the hero — a tiny WebGL fragment shader
 * (no 3D library), the page's living backdrop.
 *
 * Cost control: rendered at a fraction of the device resolution, capped at
 * 30 frames a second, paused when off-screen or in a background tab. With
 * reduced motion or on a low-power device a single still frame is drawn; if
 * WebGL is unavailable the CSS gradient underneath (the `fallback` class)
 * shows instead. The canvas is purely decorative.
 */
import { useEffect, useRef } from 'react'

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

/* Domain-warped noise folded into satin bands, lit gold on deep ink. */
const FRAGMENT = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float t = uTime * 0.045;

  vec2 q = vec2(fbm(p * 1.1 + vec2(0.0, t)), fbm(p * 1.1 + vec2(5.2, -t * 0.8)));
  vec2 r = vec2(fbm(p * 1.3 + 2.2 * q + vec2(1.7, 9.2) + uPointer * 0.12 + t * 0.6),
                fbm(p * 1.3 + 2.2 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.2 + 2.6 * r);

  // Satin: long diagonal folds whose crests catch the light.
  float fold = sin((p.x * 1.6 + p.y * 0.9) * 3.2 + f * 7.5 + t * 2.0);
  float crest = pow(0.5 + 0.5 * fold, 6.0);
  float sheen = smoothstep(0.35, 0.95, f) * 0.55 + crest * 0.75;

  vec3 ink = vec3(0.043, 0.036, 0.030);
  vec3 umber = vec3(0.105, 0.078, 0.052);
  vec3 gold = vec3(0.78, 0.60, 0.31);
  vec3 color = mix(ink, umber, smoothstep(0.2, 0.8, f));
  color += gold * sheen * 0.42;

  // Light pooled toward the upper right, deep vignette at the edges.
  float glow = smoothstep(1.25, 0.0, length(uv - vec2(0.78, 0.72)));
  color += gold * glow * 0.10;
  float vignette = smoothstep(1.15, 0.35, length(uv - 0.5));
  color *= mix(0.55, 1.0, vignette);

  // Fine film grain keeps the gradients from banding.
  color += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(color, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export function SilkCanvas({ animate, className = '' }: { animate: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    let gl: WebGLRenderingContext | null = null
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    } catch {
      gl = null
    }
    if (!gl || gl.isContextLost()) return undefined

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
    const program = gl.createProgram()
    if (!vertex || !fragment || !program) return undefined
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    const uResolution = gl.getUniformLocation(program, 'uResolution')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uPointer = gl.getUniformLocation(program, 'uPointer')

    // A soft field: rendering at ~0.5–0.75× costs a quarter of the pixels.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.55
    const resize = () => {
      const width = Math.max(1, Math.round(canvas.clientWidth * scale))
      const height = Math.max(1, Math.round(canvas.clientHeight * scale))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl?.viewport(0, 0, width, height)
      }
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onPointer = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth - 0.5
      pointer.ty = 0.5 - event.clientY / window.innerHeight
    }

    let frame = 0
    let visible = true
    let last = 0
    const start = performance.now()
    const draw = (now: number) => {
      if (!gl) return
      resize()
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      // A still frame shows a lovely moment rather than t = 0.
      gl.uniform1f(uTime, animate ? (now - start) / 1000 + 40 : 40)
      gl.uniform2f(uPointer, pointer.x, pointer.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      // Shown only once a frame exists: until then (or if WebGL fails) the
      // CSS gradient underneath is the backdrop.
      if (canvas.dataset.ready !== 'true') canvas.dataset.ready = 'true'
    }
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (!visible || document.hidden || now - last < 33) return
      last = now
      draw(now)
    }

    let observer: IntersectionObserver | null = null
    let onResize: (() => void) | null = null
    if (animate) {
      observer =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver(([entry]) => {
              visible = entry?.isIntersecting ?? true
            })
      observer?.observe(canvas)
      window.addEventListener('pointermove', onPointer, { passive: true })
      frame = requestAnimationFrame(loop)
    } else {
      onResize = () => draw(performance.now())
      window.addEventListener('resize', onResize)
      draw(performance.now())
    }

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('pointermove', onPointer)
      if (onResize) window.removeEventListener('resize', onResize)
      // Free what this mount created, but keep the context alive: React may
      // mount again on the same canvas, and a lost context cannot come back.
      if (gl && !gl.isContextLost()) {
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        gl.deleteShader(vertex)
        gl.deleteShader(fragment)
      }
    }
  }, [animate])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100 ${className}`} />
}
