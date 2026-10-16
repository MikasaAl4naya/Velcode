'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const vertexShader = `
    uniform float uRibs;
    uniform float uTwist;
    uniform float uDepth;
    uniform float uPoleDimple;
    uniform float uPoleFade;
    uniform float uFlatness;
    uniform float uGrooveGap;

    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPos;
    varying float vLobeProfile;
    varying float vCreviceMask;
    varying float vPoleFactor;
    varying float vEffectiveRelief;
    varying vec3 vSmoothNormal;

    #define PI 3.14159265358979323846

    vec3 evaluateSurface(
        float theta,
        float phi,
        out float lobeOut,
        out float creviceMaskOut,
        out float reliefFadeOut
    ) {
        float sinTheta = sin(theta);
        float cosTheta = cos(theta);

        float twistProfile = cosTheta + 0.12 * sin(2.0 * theta) * cosTheta;
        float twistedPhi = phi + uTwist * twistProfile;

        float rawWave = abs(cos(0.5 * uRibs * twistedPhi));

        float gapThreshold = uGrooveGap * 0.34;
        float shiftedWave = smoothstep(gapThreshold * 0.35, 1.0, rawWave);
        float valleyCurve = pow(shiftedWave, mix(0.82, 1.45, uGrooveGap));

        float squashPower = mix(0.88, 0.36, uFlatness);
        float roundedLobe = pow(valleyCurve, squashPower);
        float flatTopLobe = smoothstep(0.0, 1.0 - 0.32 * uFlatness, roundedLobe);
        float lobe = mix(roundedLobe, flatTopLobe, 0.55 * uFlatness);

        lobeOut = lobe;
        creviceMaskOut = 1.0 - smoothstep(0.0, mix(0.32, 0.58, uGrooveGap), rawWave);

        float poleMask = 1.0;
        float polePinch = pow(max(sinTheta, 0.0001), uPoleFade);
        float nearPoleSoftening = smoothstep(0.02, 0.38, sinTheta);
        float reliefEnvelope = mix(polePinch, polePinch * nearPoleSoftening, 0.45) * poleMask;
        reliefFadeOut = reliefEnvelope;

        float poleDepression = uPoleDimple * (
            0.65 * pow(1.0 - sinTheta, 2.1) +
            0.35 * exp(-14.0 * sinTheta * sinTheta)
        );

        float bodyPlumpness = 0.03 * sinTheta * sinTheta;
        float r = 1.0 + bodyPlumpness - poleDepression + uDepth * (lobe - 0.45) * reliefEnvelope;

        vec3 dir = vec3(
            sinTheta * cos(phi),
            cosTheta * (1.0 - 0.18 * uPoleDimple * pow(abs(cosTheta), 1.6)),
            sinTheta * sin(phi)
        );

        float sideBulge = sin(uRibs * twistedPhi);
        float bulgeStrength = uDepth * (0.09 + 0.07 * uFlatness - 0.04 * uGrooveGap) * reliefEnvelope;
        vec3 tangentPhi = vec3(-sin(phi), 0.0, cos(phi));

        vec3 pos = dir * r + tangentPhi * (sideBulge * bulgeStrength);
        return pos;
    }

    vec3 evaluateBase(float theta, float phi) {
        float sinTheta = sin(theta);
        float cosTheta = cos(theta);
        float poleDepression = uPoleDimple * (
            0.65 * pow(1.0 - sinTheta, 2.1) +
            0.35 * exp(-14.0 * sinTheta * sinTheta)
        );
        float r = 1.0 + 0.03 * sinTheta * sinTheta - poleDepression;
        vec3 dir = vec3(
            sinTheta * cos(phi),
            cosTheta * (1.0 - 0.18 * uPoleDimple * pow(abs(cosTheta), 1.6)),
            sinTheta * sin(phi)
        );
        return dir * r;
    }

    void main() {
        float theta = clamp(uv.y * PI, 0.001, PI - 0.001);
        float phi = uv.x * 2.0 * PI;

        float lobe, creviceMask, reliefFade;
        vec3 pos = evaluateSurface(theta, phi, lobe, creviceMask, reliefFade);

        float epsT = 0.0014;
        float epsP = 0.0014;
        float d1, d2, d3;

        vec3 posT1 = evaluateSurface(min(theta + epsT, PI - 0.0003), phi, d1, d2, d3);
        vec3 posT0 = evaluateSurface(max(theta - epsT, 0.0003), phi, d1, d2, d3);
        vec3 dTheta = posT1 - posT0;

        vec3 posP1 = evaluateSurface(theta, phi + epsP, d1, d2, d3);
        vec3 posP0 = evaluateSurface(theta, phi - epsP, d1, d2, d3);
        vec3 dPhi = posP1 - posP0;

        vec3 objectNormal = normalize(cross(dPhi, dTheta));

        vec3 bT = evaluateBase(min(theta + 0.01, PI - 0.0003), phi) - evaluateBase(max(theta - 0.01, 0.0003), phi);
        vec3 bP = evaluateBase(theta, phi + 0.01) - evaluateBase(theta, phi - 0.01);
        vSmoothNormal = normalize(mat3(modelMatrix) * normalize(cross(bP, bT)));

        vLobeProfile = lobe;
        vCreviceMask = creviceMask;
        vPoleFactor = sin(theta);
        vEffectiveRelief = reliefFade;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);

        vec4 mvPosition = viewMatrix * worldPosition;
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
    }
`;

const fragmentShader = `
    uniform float uLightIntensity;
    uniform float uGrooveGap;

    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPos;
    varying float vLobeProfile;
    varying float vCreviceMask;
    varying float vPoleFactor;
    varying float vEffectiveRelief;
    varying vec3 vSmoothNormal;

    void main() {
        vec3 V = normalize(vViewPosition);

        float nearPole = smoothstep(0.02, 0.55, vPoleFactor);
        vec3 N = normalize(mix(normalize(vSmoothNormal), normalize(vWorldNormal), mix(0.65, 1.0, nearPole)));

        vec3 keyDir = normalize(vec3(-0.60, 0.65, 0.45));
        float key = clamp((dot(N, keyDir) + 0.85) / 1.85, 0.0, 1.0);
        key = smoothstep(0.0, 1.0, key);

        float global = clamp(dot(normalize(vWorldPos), normalize(vec3(-0.55, 0.55, 0.62))) * 0.5 + 0.5, 0.0, 1.0);

        float light = clamp((key * 0.60 + global * 0.40) * uLightIntensity, 0.0, 1.0);

        vec3 cHigh  = vec3(0.945, 0.965, 1.000);
        vec3 cMid   = vec3(0.800, 0.835, 0.965);
        vec3 cShade = vec3(0.600, 0.650, 0.850);
        vec3 cGrey  = vec3(0.630, 0.675, 0.790);
        vec3 cDeep  = vec3(0.330, 0.390, 0.640);
        vec3 cGlow  = vec3(0.560, 0.620, 0.960);

        vec3 col = mix(cShade, cMid, smoothstep(0.20, 0.65, light));
        col = mix(col, cHigh, smoothstep(0.75, 1.05, light) * 0.65);
        col = mix(col, cGrey, (1.0 - smoothstep(0.15, 0.6, global)) * 0.45);

        float poleSoft = smoothstep(0.10, 0.78, vPoleFactor);
        poleSoft = poleSoft * poleSoft * (3.0 - 2.0 * poleSoft);
        float crevice = 1.0 - smoothstep(0.0, 0.55, clamp(vLobeProfile, 0.0, 1.0));
        vec3 creviceCol = mix(cDeep, cGlow, smoothstep(0.35, 0.9, global) * 0.6);
        creviceCol = mix(cMid, creviceCol, smoothstep(0.25, 0.85, vPoleFactor));
        col = mix(col, creviceCol, crevice * 0.78 * poleSoft);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        col += cHigh * fresnel * 0.08 * smoothstep(0.3, 0.9, global);

        vec3 H = normalize(keyDir + V);
        col += vec3(0.04) * pow(max(dot(N, H), 0.0), 24.0) * clamp(vLobeProfile, 0.0, 1.0);

        col = mix(col, cHigh, (1.0 - smoothstep(0.0, 0.16, vPoleFactor)) * 0.30);

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
`;

const PARAMS = {
  ribs: 30,
  twist: 0,
  depth: 0.3,
  poleDimple: 0.38,
  poleFade: 2,
  flatness: 0.2,
  grooveGap: 0.85,
  light: 1,
};

interface Props {
  className?: string;
}

export function HeroModel({ className = '' }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 700;

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.85);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(1, 1, 420, 210);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uRibs:          { value: PARAMS.ribs },
        uTwist:         { value: PARAMS.twist },
        uDepth:         { value: PARAMS.depth },
        uPoleDimple:    { value: PARAMS.poleDimple },
        uPoleFade:      { value: PARAMS.poleFade },
        uFlatness:      { value: PARAMS.flatness },
        uGrooveGap:     { value: PARAMS.grooveGap },
        uLightIntensity: { value: PARAMS.light },
      },
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const targetPoleDir = new THREE.Vector3(-0.46, 0.52, 0.72).normalize();
    const baseQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPoleDir);
    const spinQuat = new THREE.Quaternion().setFromAxisAngle(targetPoleDir, 0.15);
    baseQuat.premultiply(spinQuat);
    mesh.quaternion.copy(baseQuat);
    mesh.scale.setScalar(0.98);
    mesh.position.set(-0.01, 0.01, 0);

    scene.add(mesh);

    const updateSize = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const radius = Math.min(rect.width, rect.height) * 0.5;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius * 1.15) {
        targetMouseX = Math.max(-1, Math.min(1, dx / radius));
        targetMouseY = Math.max(-1, Math.min(1, -dy / radius));
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      currentMouseX += (targetMouseX - currentMouseX) * 0.025;
      currentMouseY += (targetMouseY - currentMouseY) * 0.025;

      const mouseTiltX = -currentMouseY * 0.12;
      const mouseTiltY = currentMouseX * 0.15;
      const mouseTiltZ = -currentMouseX * 0.04;

      const wobX = (k: number) => Math.sin(k * 0.22) * 0.14 + Math.sin(k * 0.11) * 0.05;
      const wobY = (k: number) => Math.sin(k * 0.18 + 1.2) * 0.15 + Math.cos(k * 0.09) * 0.04;
      const wobZ = (k: number) => Math.cos(k * 0.15 + 0.8) * 0.10 + Math.sin(k * 0.07) * 0.03;

      const rotX = wobX(t) - wobX(0) + mouseTiltX;
      const rotY = wobY(t) - wobY(0) + mouseTiltY;
      const rotZ = wobZ(t) - wobZ(0) + mouseTiltZ;

      const wobbleQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rotX, rotY, rotZ, 'YXZ')
      );
      mesh.quaternion.copy(baseQuat).multiply(wobbleQuat);

      const parallaxX = currentMouseX * 0.016;
      const parallaxY = currentMouseY * 0.016;
      mesh.position.y = 0.045 + Math.sin(t * 0.19) * 0.008 + parallaxY;
      mesh.position.x = -0.05 + (Math.cos(t * 0.15) - 1.0) * 0.008 + parallaxX;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  if (failed) {
    return (
      <img
        src="/assets/hero-abstract-torus.png"
        alt=""
        aria-hidden="true"
        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`hero-model-container ${className}`.trim()}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
