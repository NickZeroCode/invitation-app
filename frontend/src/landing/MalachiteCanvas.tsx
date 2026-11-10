/**
 * A slab of Katanga malachite, alive — the house's signature ground. A tiny
 * WebGL fragment shader (no 3D library) draws the stone's concentric bands
 * around a few nodules, posterised into a handful of FLAT greens with fine
 * pale veins between them: colour fields, never a gradient. The bands drift
 * outward very slowly and lean a little toward the pointer.
 *
 * Cost control: rendered at a fraction of the device resolution, capped at
 * 30 frames a second, paused off-screen and in background tabs. With reduced
 * motion or on a low-power device one still frame is drawn; if WebGL is
 * unavailable the flat malachite colour underneath shows instead. Purely
 * decorative.
 */
import { useEffect, useRef } from 'react'

const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float hash1(float n) { return fract(sin(n * 91.345) * 47453.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + vec2(3.1, 1.7); a *= 0.5; }
  return v;
}
// Smooth minimum: neighbouring nodules merge like grown stone.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float t = uTime * 0.03;
  vec2 q = p * 1.35 + vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.0)) * 0.55 + uPointer * 0.06;

  float d = length(q - vec2(-0.75, 0.32));
  d = smin(d, length(q - vec2(0.62, -0.18)) * 1.08, 0.35);
  d = smin(d, length(q - vec2(0.05, -0.85)) * 0.92, 0.35);
  d = smin(d, length(q - vec2(1.25, 0.75)) * 1.15, 0.35);

  float bands = d * 17.0 + fbm(q * 3.4) * 1.6 - uTime * 0.06;
  float index = floor(bands);
  float within = fract(bands);

  // Four flat greens, chosen per band; a pale vein where two bands meet.
  float pick = hash1(index);
  vec3 c0 = vec3(0.020, 0.063, 0.045);
  vec3 c1 = vec3(0.027, 0.082, 0.059);
  vec3 c2 = vec3(0.035, 0.102, 0.075);
  vec3 c3 = vec3(0.047, 0.129, 0.094);
  vec3 color = pick < 0.3 ? c0 : pick < 0.58 ? c1 : pick < 0.84 ? c2 : c3;
  vec3 vein = vec3(0.110, 0.216, 0.157);
  float edge = 1.0 - smoothstep(0.0, 0.035, within);
  color = mix(color, vein, edge * step(0.55, hash1(index + 7.0)));

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

export function MalachiteCanvas({ animate, still = 40, className = '' }: { animate: boolean; still?: number; className?: string }) {
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

    // Crisp enough for the veins, still a fraction of the pixels.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7
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
      gl.uniform1f(uTime, animate ? (now - start) / 1000 + still : still)
      gl.uniform2f(uPointer, pointer.x, pointer.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      // Shown once a frame exists; until then the flat colour beneath is the ground.
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
      // Free this mount's resources but keep the context: React may mount
      // again on the same canvas, and a lost context cannot come back.
      if (gl && !gl.isContextLost()) {
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        gl.deleteShader(vertex)
        gl.deleteShader(fragment)
      }
    }
  }, [animate, still])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100 ${className}`}
    />
  )
}
