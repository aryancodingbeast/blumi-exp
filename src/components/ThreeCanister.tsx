'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'

if (typeof window !== 'undefined' && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger)
}

// 3D Simplex Noise GLSL implementation
const noiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

const vertexShader = `
uniform float uTime;
uniform float uNoiseStrength;
uniform float uScrollProgress;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vNoise;

${noiseGLSL}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // High-fidelity compound noise deformation to undulate organic torus
  vec3 noiseInput1 = vec3(position.x * 0.45, position.y * 0.4 + uTime * 0.7, position.z * 0.45);
  vec3 noiseInput2 = vec3(position.x * 0.95, position.y * 0.75 - uTime * 0.35, position.z * 0.95);
  
  float n1 = snoise(noiseInput1) * uNoiseStrength;
  float n2 = snoise(noiseInput2) * (uNoiseStrength * 0.4);
  vNoise = n1 + n2;
  
  // Displace geometry along surface normal
  vec3 displacedPosition = position + normal * vNoise;
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
uniform vec3 uBaseColor;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vNoise;

${noiseGLSL}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Fresnel glow highlights
  float ndotv = max(dot(normal, viewDir), 0.0);
  float fresnel = pow(1.0 - ndotv, 3.5);

  // Metallic matcap spherical coordinates mapping
  vec3 reflectDir = reflect(-viewDir, normal);
  float m = 2.0 * sqrt(pow(reflectDir.x, 2.0) + pow(reflectDir.y, 2.0) + pow(reflectDir.z + 1.0, 2.0));
  vec2 matcapUv = reflectDir.xy / m + 0.5;
  
  // Shaders.com Fluid Chrome flow simulation inside matcap coordinates
  vec3 fluidNoiseCoord = vec3(normal.xy * 1.8, uTime * 0.35);
  float fn = snoise(fluidNoiseCoord);
  vec2 flowOffset = vec2(fn, fn) * 0.055 * (1.0 - ndotv);
  
  vec2 uvSample = matcapUv + flowOffset;
  
  // Procedural grayscale environment reflections
  float value = sin(uvSample.x * 6.5 + uTime * 0.12) * 0.5 + 0.5;
  
  // Stark monochromatic silver base chrome color palette (fully gray)
  vec3 silverBase = vec3(0.65, 0.65, 0.68);
  vec3 silverHighlight = vec3(0.95, 0.95, 0.97);
  vec3 reflection = mix(silverBase, silverHighlight, value * (0.65 + fresnel * 0.35));
  
  // Specular shine hotspot
  vec3 lightDir = normalize(vec3(5.0, 10.0, 4.0));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 96.0);
  
  // Mix dynamic gray reflections with environment base color
  vec3 finalColor = mix(reflection, uBaseColor, fresnel * 0.32);
  
  // Render output
  gl_FragColor = vec4(finalColor + vec3(spec * 0.85), 1.0);
}
`

export default function ThreeCanister() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100)
    camera.position.z = 8.5

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    // Canister uniforms
    const uniforms = {
      uTime: { value: 0.0 },
      uNoiseStrength: { value: 0.15 },
      uScrollProgress: { value: 0.0 },
      uBaseColor: { value: new THREE.Color('#0a0a0a') },
    }

    // 1. TorusGeometry to exactly match the hollow organic ring visual in the reference image
    const geometry = new THREE.TorusGeometry(1.4, 0.52, 64, 256)
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      transparent: true,
    })

    const mesh = new THREE.Mesh(geometry, material)
    // Mesh postural tilt
    mesh.rotation.x = 0.35
    mesh.rotation.y = 0.15
    mesh.rotation.z = -0.05
    scene.add(mesh)

    // 2. Slow Orbiting Liquid Droplets System (Droplets)
    const particleCount = 180
    const particleGeometry = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleData = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3
      const radius = 2.4 + Math.random() * 0.8
      const x = Math.cos(angle) * radius
      const y = (Math.random() - 0.5) * 3.6
      const z = Math.sin(angle) * radius

      particlePositions[i * 3] = x
      particlePositions[i * 3 + 1] = y
      particlePositions[i * 3 + 2] = z

      particleData[i * 3] = angle
      particleData[i * 3 + 1] = radius
      particleData[i * 3 + 2] = Math.random() * 0.012 + 0.003
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color('#ff3e15'),
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    // Interactive spring coordinates
    const mouse = { x: 0, y: 0 }
    const currentMouse = { x: 0, y: 0 }
    const targetMouse = { x: 0, y: 0 }
    const clock = new THREE.Clock()

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      targetMouse.x = mouse.x
      targetMouse.y = mouse.y
    }
    window.addEventListener('mousemove', onMouseMove)

    // Responsive scaling
    const adjustScale = () => {
      const w = container.clientWidth
      if (w < 480) return 0.68
      if (w < 768) return 0.85
      return 1.15
    }
    const baseScale = adjustScale()

    // Position initial states (Starts low, Y = -3.8 and scale = 0)
    mesh.position.y = -3.8
    particles.position.y = -3.8
    mesh.scale.set(0, 0, 0)
    particles.scale.set(0, 0, 0)

    // GSAP ScrollTrigger Timeline for down-to-up Y-position rising and scale-vanishing curves
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top bottom', // starts when the top of the container enters the bottom viewport
        end: 'bottom top',   // ends when the bottom of the container leaves the top viewport
        scrub: 1.0,          // smooth spring scrubbing
      }
    })

    // 1. Position rising from -3.8 (down) to 3.8 (up)
    tl.to([mesh.position, particles.position], {
      y: 3.8,
      ease: 'none',
    }, 0)

    // 2. Continuous rotation over scroll progress
    tl.to(mesh.rotation, {
      y: Math.PI * 4.0,
      ease: 'none',
    }, 0)
    tl.to(particles.rotation, {
      y: -Math.PI * 2.5,
      ease: 'none',
    }, 0)

    // 3. Noise and progress shader uniforms updates
    tl.to(uniforms.uScrollProgress, {
      value: 1.0,
      ease: 'none',
    }, 0)
    tl.to(uniforms.uNoiseStrength, {
      value: 0.32,
      ease: 'none',
    }, 0)

    // 4. Fluid scale-up (down viewport) -> fully visible (center viewport) -> scale-down (top viewport)
    tl.to([mesh.scale, particles.scale], {
      x: baseScale,
      y: baseScale,
      z: baseScale,
      duration: 0.5,
      ease: 'power2.out',
    }, 0)
    .to([mesh.scale, particles.scale], {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      ease: 'power2.in',
    }, 0.5)

    // Animation loop
    let animationFrameId: number

    const tick = () => {
      const elapsedTime = clock.getElapsedTime()
      uniforms.uTime.value = elapsedTime

      // Smooth mouse coordinate updates
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08

      // Rotate torus dynamically on hover
      mesh.rotation.x = 0.35 + currentMouse.y * 0.22
      mesh.rotation.y += 0.004 + currentMouse.x * 0.012

      // Animate particles orbit
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < particleCount; i++) {
        const speed = particleData[i * 3 + 2]
        particleData[i * 3] += speed
        const angle = particleData[i * 3]
        const radius = particleData[i * 3 + 1]

        posAttr.setX(i, Math.cos(angle) * radius)
        posAttr.setZ(i, Math.sin(angle) * radius)

        const origY = particlePositions[i * 3 + 1]
        posAttr.setY(i, origY + Math.sin(elapsedTime * 1.2 + angle * 3.0) * 0.04)
      }
      posAttr.needsUpdate = true

      particles.rotation.x = currentMouse.y * 0.1
      particles.rotation.z = -0.05 + currentMouse.x * 0.08

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(tick)
    }
    tick()

    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      
      const newScale = adjustScale()
      // Update running values in GSAP timeline to respect new scale if active
      if (tl.scrollTrigger) {
        const progress = tl.scrollTrigger.progress
        if (progress > 0 && progress < 1.0) {
          const currentFactor = progress < 0.5 ? (progress / 0.5) : (1.0 - (progress - 0.5) / 0.5)
          mesh.scale.set(newScale * currentFactor, newScale * currentFactor, newScale * currentFactor)
          particles.scale.set(newScale * currentFactor, newScale * currentFactor, newScale * currentFactor)
        }
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', handleResize)
      tl.kill()
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      particleGeometry.dispose()
      particleMaterial.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className="three-canister-container">
      <canvas ref={canvasRef} className="three-canister-canvas" />
      <style jsx>{`
        .three-canister-container {
          width: 100%;
          height: 100%;
          min-height: 480px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: transparent;
        }
        .three-canister-canvas {
          width: 100% !important;
          height: 100% !important;
          max-width: 700px;
          aspect-ratio: 1;
          outline: none;
          z-index: 10;
        }
        @media (max-width: 768px) {
          .three-canister-container {
            min-height: 380px;
          }
        }
      `}</style>
    </div>
  )
}
