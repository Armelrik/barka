"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { TourSceneDto } from "@/modules/tours/validation";
type Props = {
  scene?: TourSceneDto;
  modelUrl?: string;
  onHotspot: (target: string | null, label: string) => void;
  resetKey: number;
};
export default function WebglView({
  scene: room,
  modelUrl,
  onHotspot,
  resetKey,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    callback = useRef(onHotspot);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    callback.current = onHotspot;
  }, [onHotspot]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      queueMicrotask(() => {
        setState("error");
        setMessage(
          "L’affichage immersif nécessite WebGL 2. Essayez un autre navigateur ou appareil.",
        );
      });
      return;
    }
    let stopped = false,
      frame = 0,
      controls: OrbitControls | null = null,
      texture: THREE.Texture | null = null;
    const abort = new AbortController();
    const world = new THREE.Scene();
    world.background = new THREE.Color(modelUrl ? "#edf2f7" : "#102131");
    const camera = new THREE.PerspectiveCamera(
      modelUrl ? 45 : 75,
      1,
      0.01,
      2000,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute(
      "aria-label",
      modelUrl
        ? "Modèle 3D : glissez pour tourner, utilisez la molette pour zoomer, flèches pour déplacer la vue."
        : "Panorama 360° : glissez pour regarder autour de vous, utilisez les flèches du clavier et les touches plus et moins.",
    );
    el.appendChild(renderer.domElement);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const ready = () => {
      if (!stopped) {
        setState("ready");
        setMessage("");
      }
    };
    const fail = () => {
      if (!stopped) {
        setState("error");
        setMessage(
          "Le média n’a pas pu être chargé. Revenez à la fiche ou réessayez.",
        );
      }
    };
    queueMicrotask(() => {
      if (!stopped) setState("loading");
    });
    const buttons: HTMLButtonElement[] = [];
    let yaw = room?.initialYaw ?? 0,
      pitch = room?.initialPitch ?? 0,
      drag = false,
      startX = 0,
      startY = 0,
      originYaw = 0,
      originPitch = 0;
    const look = () => {
      const a = THREE.MathUtils.degToRad(yaw),
        b = THREE.MathUtils.degToRad(pitch);
      camera.lookAt(
        Math.sin(a) * Math.cos(b),
        Math.sin(b),
        -Math.cos(a) * Math.cos(b),
      );
    };
    const down = (event: PointerEvent) => {
      if (modelUrl) return;
      drag = true;
      startX = event.clientX;
      startY = event.clientY;
      originYaw = yaw;
      originPitch = pitch;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (drag) {
        yaw = originYaw - (event.clientX - startX) * 0.18;
        pitch = Math.max(
          -85,
          Math.min(85, originPitch + (event.clientY - startY) * 0.18),
        );
        look();
      }
    };
    const up = () => {
      drag = false;
    };
    const wheel = (event: WheelEvent) => {
      if (modelUrl) return;
      event.preventDefault();
      camera.fov = Math.max(
        35,
        Math.min(100, camera.fov + event.deltaY * 0.03),
      );
      camera.updateProjectionMatrix();
    };
    const key = (event: KeyboardEvent) => {
      if (modelUrl) {
        if (event.key === "ArrowLeft")
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.08);
        else if (event.key === "ArrowRight")
          camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.08);
        else if (event.key === "+" || event.key === "=")
          camera.position.multiplyScalar(0.9);
        else if (event.key === "-") camera.position.multiplyScalar(1.1);
        else return;
        controls?.update();
        event.preventDefault();
        return;
      }
      if (event.key === "ArrowLeft") yaw -= 6;
      else if (event.key === "ArrowRight") yaw += 6;
      else if (event.key === "ArrowUp") pitch = Math.min(85, pitch + 6);
      else if (event.key === "ArrowDown") pitch = Math.max(-85, pitch - 6);
      else if (event.key === "+" || event.key === "=")
        camera.fov = Math.max(35, camera.fov - 5);
      else if (event.key === "-") camera.fov = Math.min(100, camera.fov + 5);
      else return;
      event.preventDefault();
      camera.updateProjectionMatrix();
      look();
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    renderer.domElement.addEventListener("keydown", key);
    const lost = (event: Event) => {
      event.preventDefault();
      fail();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    if (modelUrl) {
      camera.position.set(12, 10, 14);
      world.add(new THREE.HemisphereLight(0xffffff, 0x7a7c80, 3));
      const sun = new THREE.DirectionalLight(0xffffff, 3);
      sun.position.set(10, 15, 5);
      world.add(sun);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.minDistance = 1;
      controls.maxDistance = 80;
      fetch(modelUrl, { signal: abort.signal, credentials: "same-origin" })
        .then((r) => {
          if (!r.ok) throw new Error("media");
          return r.arrayBuffer();
        })
        .then(
          (data) =>
            new Promise<THREE.Group>((resolve, reject) =>
              new GLTFLoader().parse(data, "", (g) => resolve(g.scene), reject),
            ),
        )
        .then((group) => {
          if (stopped) {
            dispose(group);
            return;
          }
          const box = new THREE.Box3().setFromObject(group);
          if (box.isEmpty()) throw new Error("empty");
          const center = box.getCenter(new THREE.Vector3()),
            originalSize = box.getSize(new THREE.Vector3()).length();
          if (!Number.isFinite(originalSize) || originalSize <= 0)
            throw new Error("invalid bounds");
          const factor = 10 / originalSize,
            size = 10;
          group.position.sub(center).multiplyScalar(factor);
          group.scale.multiplyScalar(factor);
          world.add(group);
          camera.position.set(size * 0.8, size * 0.65, size * 0.9);
          controls!.target.set(0, 0, 0);
          controls!.minDistance = Math.max(0.1, size * 0.05);
          controls!.maxDistance = size * 4;
          controls!.update();
          ready();
        })
        .catch(() => {
          if (!abort.signal.aborted) fail();
        });
    } else if (room) {
      look();
      const geometry = new THREE.SphereGeometry(100, 64, 40);
      geometry.scale(-1, 1, 1);
      geometry.rotateY(-Math.PI / 2);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      world.add(new THREE.Mesh(geometry, material));
      new THREE.TextureLoader().load(
        room.image,
        (t) => {
          texture = t;
          if (stopped) {
            t.dispose();
            return;
          }
          t.colorSpace = THREE.SRGBColorSpace;
          material.map = t;
          material.needsUpdate = true;
          ready();
        },
        undefined,
        fail,
      );
      for (const h of room.hotspots) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tour-hotspot";
        button.title = h.label;
        button.setAttribute(
          "aria-label",
          h.targetSceneId ? `Aller à ${h.label}` : `Information : ${h.label}`,
        );
        button.textContent = h.targetSceneId ? "↗" : "i";
        button.addEventListener("click", () =>
          callback.current(h.targetSceneId, h.label),
        );
        el.appendChild(button);
        buttons.push(button);
      }
    }
    const tick = () => {
      if (stopped) return;
      controls?.update();
      if (room && !modelUrl) {
        room.hotspots.forEach((h, i) => {
          const a = THREE.MathUtils.degToRad(h.yaw),
            b = THREE.MathUtils.degToRad(h.pitch),
            point = new THREE.Vector3(
              Math.sin(a) * Math.cos(b) * 10,
              Math.sin(b) * 10,
              -Math.cos(a) * Math.cos(b) * 10,
            );
          const front =
            point.clone().applyMatrix4(camera.matrixWorldInverse).z < 0;
          point.project(camera);
          const button = buttons[i];
          if (button) {
            button.hidden =
              !front || Math.abs(point.x) > 1 || Math.abs(point.y) > 1;
            button.style.left = `${(point.x * 0.5 + 0.5) * 100}%`;
            button.style.top = `${(-point.y * 0.5 + 0.5) * 100}%`;
          }
        });
      }
      renderer.render(world, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      stopped = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls?.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", up);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.domElement.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      buttons.forEach((b) => b.remove());
      texture?.dispose();
      dispose(world);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [room, modelUrl, resetKey]);
  return (
    <div className="webgl-surface" ref={host} data-renderer-state={state}>
      {state === "loading" && (
        <div className="tour-loading" role="status">
          Chargement de la visite…
        </div>
      )}
      {state === "error" && (
        <div className="tour-error" role="alert">
          {message}
        </div>
      )}
    </div>
  );
}
function dispose(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) {
            value.source?.data?.close?.();
            value.dispose();
          }
        material.dispose();
      }
    }
  });
}
