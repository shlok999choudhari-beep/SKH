'use client'

import React, { useEffect, useRef } from 'react'

export interface SideRaysProps {
  speed?: number
  rayColor1?: string
  rayColor2?: string
  intensity?: number
  spread?: number
  origin?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center-right' | 'center-left'
  tilt?: number
  saturation?: number
  blend?: number
  falloff?: number
  opacity?: number
  className?: string
  style?: React.CSSProperties
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').padEnd(6, '0')
  const num = parseInt(clean.slice(0, 6), 16)
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255]
}

function getOriginUV(origin: string): [number, number] {
  switch (origin) {
    case 'top-left': return [0.0, 1.0]
    case 'bottom-right': return [1.0, 0.0]
    case 'bottom-left': return [0.0, 0.0]
    case 'center-right': return [1.0, 0.5]
    case 'center-left': return [0.0, 0.5]
    case 'top-right':
    default: return [1.0, 1.0]
  }
}

export default function SideRays({
  speed = 2.5,
  rayColor1 = '#EAB308',
  rayColor2 = '#96c8ff',
  intensity = 2,
  spread = 2,
  origin = 'top-right',
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1.0,
  className = '',
  style = {},
}: SideRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true })
    if (!gl) return

    const vsSource = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec3 u_col1;
      uniform vec3 u_col2;
      uniform vec2 u_origin;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_spread;
      uniform float u_tilt;
      uniform float u_blend;
      uniform float u_falloff;
      uniform float u_opacity;

      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float hash2(vec2 p) {
        p = fract(p * vec2(127.1, 311.7));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),
                   mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x),f.y);
      }

      void main() {
        vec2 st = v_uv;
        float ar = u_res.x / u_res.y;
        vec2 asp = vec2(st.x * ar, st.y);
        vec2 orig = vec2(u_origin.x * ar, u_origin.y);
        float rad = radians(u_tilt);
        vec2 dir = asp - orig;
        float rotX = dir.x * cos(rad) - dir.y * sin(rad);
        float rotY = dir.x * sin(rad) + dir.y * cos(rad);
        dir = vec2(rotX, rotY);
        float dist = length(dir);
        float angle = atan(dir.y, dir.x);
        float t = u_time * u_speed * 0.25;
        float n = noise(vec2(angle * 4.0 * u_spread + sin(dist * 3.0 - t) * 0.5, t * 0.5));
        float ray = sin(angle * 8.0 * u_spread + n * 6.0 + t) * 0.5 + 0.5;
        ray = pow(ray, 3.0 / max(u_blend, 0.01));
        float fd = pow(max(0.0, 1.0 - dist / u_falloff), 2.0);
        float core = smoothstep(0.5, 0.0, dist) * 0.5;
        float strength = (ray * fd + core) * u_intensity;
        vec3 col = mix(u_col1, u_col2, clamp(angle / 3.14159 + 0.5, 0.0, 1.0));
        // saturation adjustment
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(vec3(lum), col, u_spread * 0.5 + 0.5);
        float alpha = clamp(strength * u_opacity * 0.8, 0.0, 1.0);
        gl_FragColor = vec4(col * strength * u_opacity, alpha);
      }
    `

    const glCtx = gl
    function compileShader(type: number, src: string) {
      const s = glCtx.createShader(type)!
      glCtx.shaderSource(s, src)
      glCtx.compileShader(s)
      if (!glCtx.getShaderParameter(s, glCtx.COMPILE_STATUS)) { console.error(glCtx.getShaderInfoLog(s)); return null }
      return s
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource)
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return

    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uCol1 = gl.getUniformLocation(prog, 'u_col1')
    const uCol2 = gl.getUniformLocation(prog, 'u_col2')
    const uOrig = gl.getUniformLocation(prog, 'u_origin')
    const uSpd = gl.getUniformLocation(prog, 'u_speed')
    const uInt = gl.getUniformLocation(prog, 'u_intensity')
    const uSpr = gl.getUniformLocation(prog, 'u_spread')
    const uTilt = gl.getUniformLocation(prog, 'u_tilt')
    const uBlend = gl.getUniformLocation(prog, 'u_blend')
    const uFall = gl.getUniformLocation(prog, 'u_falloff')
    const uOpac = gl.getUniformLocation(prog, 'u_opacity')

    const c1 = hexToRgb(rayColor1)
    const c2 = hexToRgb(rayColor2)
    const orig = getOriginUV(origin)

    let raf: number
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.parentElement?.clientWidth || window.innerWidth
      const h = canvas.parentElement?.clientHeight || window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    window.addEventListener('resize', resize); resize()

    const render = () => {
      const t = (performance.now() - start) / 1000
      gl.useProgram(prog)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
      gl.uniform3f(uCol1, c1[0], c1[1], c1[2])
      gl.uniform3f(uCol2, c2[0], c2[1], c2[2])
      gl.uniform2f(uOrig, orig[0], orig[1])
      gl.uniform1f(uSpd, speed)
      gl.uniform1f(uInt, intensity)
      gl.uniform1f(uSpr, spread)
      gl.uniform1f(uTilt, tilt)
      gl.uniform1f(uBlend, blend)
      gl.uniform1f(uFall, falloff)
      gl.uniform1f(uOpac, opacity)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [speed, rayColor1, rayColor2, intensity, spread, origin, tilt, saturation, blend, falloff, opacity])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', pointerEvents: 'none', ...style }}
    />
  )
}
