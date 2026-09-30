"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"
import { gsap, prefersReducedMotion } from "@/lib/gsap"

/*
 * Globo em pixel-art 3D (voxels), inspirado no poster do IT-WORKS.
 * Uma única InstancedMesh para a casca da esfera (~2k cubos) + nuvens em blocos.
 * Pausa quando sai da tela/aba e respeita "reduzir movimento".
 */

const R = 13

// ruído barato e determinístico para desenhar continentes
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
function smooth(t: number) {
  return t * t * (3 - 2 * t)
}
function valueNoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz)
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  )
}
function fbm(x: number, y: number, z: number) {
  return valueNoise(x, y, z) * 0.6 + valueNoise(x * 2.1, y * 2.1, z * 2.1) * 0.3 + valueNoise(x * 4.3, y * 4.3, z * 4.3) * 0.1
}

const OCEAN = ["#1c5fd0", "#2479e3", "#2f8ff0", "#1a4fae"]
const LAND = ["#2fae63", "#48c878", "#27925a", "#6fd89a"]
const COAST = "#9fe8c4"
const ICE = "#e9f3f7"

export default function VoxelGlobe({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" })
    } catch {
      return // sem WebGL: o globo simplesmente não aparece
    }

    const reduced = prefersReducedMotion()
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"
    renderer.domElement.style.touchAction = "pan-y"

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 1, 200)
    camera.position.set(0, 0, 58)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const sun = new THREE.DirectionalLight(0xffffff, 1.9)
    sun.position.set(-30, 26, 30)
    scene.add(sun)
    const rim = new THREE.DirectionalLight(0x2fe6f2, 0.35)
    rim.position.set(30, -10, -20)
    scene.add(rim)

    const globe = new THREE.Group()
    globe.rotation.z = -0.28
    scene.add(globe)

    // ── casca de voxels ──
    const cells: { p: THREE.Vector3; c: THREE.Color }[] = []
    const tmp = new THREE.Vector3()
    for (let x = -R; x <= R; x++)
      for (let y = -R; y <= R; y++)
        for (let z = -R; z <= R; z++) {
          const d = Math.sqrt(x * x + y * y + z * z)
          if (d > R || d <= R - 1.25) continue
          tmp.set(x, y, z).normalize()
          const n = fbm(tmp.x * 2.2 + 5, tmp.y * 2.2 + 1, tmp.z * 2.2 + 9)
          let col: string
          if (Math.abs(tmp.y) > 0.9) col = ICE
          else if (n > 0.56) col = LAND[Math.floor(hash3(x, y, z) * LAND.length)]
          else if (n > 0.53) col = COAST
          else col = OCEAN[Math.floor(hash3(z, x, y) * OCEAN.length)]
          cells.push({ p: new THREE.Vector3(x, y, z), c: new THREE.Color(col) })
        }

    const cube = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshLambertMaterial()
    const mesh = new THREE.InstancedMesh(cube, mat, cells.length)
    const m4 = new THREE.Matrix4()
    cells.forEach((cell, i) => {
      m4.makeTranslation(cell.p.x, cell.p.y, cell.p.z)
      mesh.setMatrixAt(i, m4)
      mesh.setColorAt(i, cell.c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    globe.add(mesh)

    // ── nuvens em blocos ──
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f5 })
    const cloudShadeMat = new THREE.MeshLambertMaterial({ color: 0xa9aab4 })
    const clouds = new THREE.Group()
    const cloudShape = [
      [0, 0, 5, 1], [1, 1, 3, 1], [-2, -1, 8, 1], [4, 0, 2, 1],
    ]
    const makeCloud = (shade: boolean) => {
      const g = new THREE.Group()
      cloudShape.forEach(([x, y, w]) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1, 2), shade ? cloudShadeMat : cloudMat)
        b.position.set(x + w / 2, y, 0)
        g.add(b)
      })
      return g
    }
    const cloudDefs = [
      { lat: 0.35, lon: 0.2, shade: false },
      { lat: -0.25, lon: 2.4, shade: true },
      { lat: 0.6, lon: 4.1, shade: false },
      { lat: -0.05, lon: 5.2, shade: false },
    ]
    cloudDefs.forEach(({ lat, lon, shade }) => {
      const pivot = new THREE.Group()
      const c = makeCloud(shade)
      c.position.set(0, 0, R + 2.4)
      pivot.add(c)
      pivot.rotation.set(lat, lon, 0)
      clouds.add(pivot)
    })
    globe.add(clouds)

    // ── tamanho ──
    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // ── arrastar para girar (só no eixo horizontal, rolagem vertical continua livre) ──
    let dragging = false
    let lastX = 0
    let velocity = reduced ? 0 : 0.0035
    const baseSpeed = reduced ? 0 : 0.0035
    const onDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      globe.rotation.y += dx * 0.01
      velocity = dx * 0.0012
    }
    const onUp = () => (dragging = false)
    renderer.domElement.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    // ── loop com pausa fora da tela ──
    let visible = true
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    io.observe(host)

    function tick() {
      raf = 0
      if (!visible || document.hidden) return
      if (!dragging) {
        velocity += (baseSpeed - velocity) * 0.03
        globe.rotation.y += velocity
      }
      clouds.rotation.y += reduced ? 0 : 0.0016
      renderer.render(scene, camera)
      if (!reduced || dragging) raf = requestAnimationFrame(tick)
    }

    const onVis = () => {
      if (!document.hidden && !raf) raf = requestAnimationFrame(tick)
    }
    document.addEventListener("visibilitychange", onVis)
    // com "reduzir movimento" ainda permite arrastar
    const onReducedDrag = () => {
      if (reduced && !raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener("pointermove", onReducedDrag)

    // entrada
    globe.scale.setScalar(reduced ? 1 : 0.55)
    renderer.render(scene, camera)
    const intro = reduced
      ? null
      : gsap.to(globe.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: "expo.out", delay: 0.15 })
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      intro?.kill()
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      renderer.domElement.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointermove", onReducedDrag)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose()
      })
      mat.dispose()
      cloudMat.dispose()
      cloudShadeMat.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} aria-hidden className={cn("relative", className)} />
}
