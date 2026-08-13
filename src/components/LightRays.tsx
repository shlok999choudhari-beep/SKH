'use client'

import React, { useEffect, useRef } from 'react'

export interface LightRaysProps {
  raysOrigin?: 'top-center' | 'top-left' | 'top-right' | 'center' | 'bottom-center'
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  followMouse?: boolean
  mouseInfluence?: number
  noiseAmount?: number
  distortion?: number
  className?: string
  style?: React.CSSProperties
}

function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num)) return [0, 1, 1] // Default cyan
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ]
}

function getOriginCoords(origin: string): [number, number] {
  switch (origin) {
    case 'top-left':
      return [0.0, 1.0]
    case 'top-right':
      return [1.0, 1.0]
    case 'center':
      return [0.5, 0.5]
    case 'bottom-center':
      return [0.5, 0.0]
    case 'top-center':
    default:
      return [0.5, 1.0]
  }
}

export default function LightRays({
  raysOrigin = 'top-center',
  raysColor = '#00ffff',
  raysSpeed = 1.5,
  lightSpread = 0.8,
  rayLength = 1.2,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.1,
  distortion = 0.05,
  className = '',
  style = {},
}: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) {
      console.warn('WebGL not supported for LightRays component')
      return
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform vec3 u_color;
      uniform vec2 u_origin;
      uniform float u_speed;
      uniform float u_spread;
      uniform float u_length;
      uniform float u_mouse_influence;
      uniform float u_noise;
      uniform float u_distortion;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        vec2 origin = u_origin;
        
        vec2 mouseOffset = (u_mouse - vec2(0.5)) * u_mouse_influence;
        origin += mouseOffset;

        vec2 dir = st - origin;
        // Fix aspect ratio distortion
        dir.x *= u_resolution.x / u_resolution.y;

        float dist = length(dir);
        float angle = atan(dir.y, dir.x);

        float time = u_time * u_speed;

        float n = noise(vec2(angle * 6.0 + sin(dist * 4.0 - time) * u_distortion * 10.0, time * 0.4));
        float rayPattern = sin(angle * 12.0 + n * u_noise * 15.0 + time * 0.6) * 0.5 + 0.5;
        rayPattern = pow(rayPattern, 2.5 / max(u_spread, 0.1));

        float fade = smoothstep(u_length * 1.5, 0.0, dist);
        
        // Ray intensity gradient
        float coreGlow = smoothstep(0.4, 0.0, dist) * 0.6;
        float finalRay = (rayPattern * fade + coreGlow) * (0.7 + 0.3 * n);

        vec3 finalColor = u_color * finalRay;
        float alpha = clamp(finalRay * 0.75, 0.0, 1.0);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vertShader || !fragShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const aPosition = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')
    const uColor = gl.getUniformLocation(program, 'u_color')
    const uOrigin = gl.getUniformLocation(program, 'u_origin')
    const uSpeed = gl.getUniformLocation(program, 'u_speed')
    const uSpread = gl.getUniformLocation(program, 'u_spread')
    const uLength = gl.getUniformLocation(program, 'u_length')
    const uMouseInfluence = gl.getUniformLocation(program, 'u_mouse_influence')
    const uNoise = gl.getUniformLocation(program, 'u_noise')
    const uDistortion = gl.getUniformLocation(program, 'u_distortion')

    const rgb = hexToRgb(raysColor)
    const originCoords = getOriginCoords(raysOrigin)

    let animationFrameId: number
    let startTime = performance.now()

    const handleMouseMove = (e: MouseEvent) => {
      if (!followMouse) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: 1.0 - (e.clientY - rect.top) / rect.height,
      }
    }

    if (followMouse) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = canvas.parentElement?.clientWidth || window.innerWidth
      const height = canvas.parentElement?.clientHeight || window.innerHeight
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    window.addEventListener('resize', resize)
    resize()

    const render = () => {
      const now = performance.now()
      const time = (now - startTime) / 1000

      gl.useProgram(program)

      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.uniform1f(uTime, time)
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y)
      gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2])
      gl.uniform2f(uOrigin, originCoords[0], originCoords[1])
      gl.uniform1f(uSpeed, raysSpeed)
      gl.uniform1f(uSpread, lightSpread)
      gl.uniform1f(uLength, rayLength)
      gl.uniform1f(uMouseInfluence, followMouse ? mouseInfluence : 0)
      gl.uniform1f(uNoise, noiseAmount)
      gl.uniform1f(uDistortion, distortion)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      if (followMouse) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [
    raysOrigin,
    raysColor,
    raysSpeed,
    lightSpread,
    rayLength,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
