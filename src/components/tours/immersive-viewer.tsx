"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
  Play,
  Pause,
  RotateCcw,
  Box,
  ScanEye,
  Layers,
  X,
} from "lucide-react";
import type { TourDto } from "@/modules/tours/validation";
const WebglView = dynamic(() => import("./webgl-view"), {
  ssr: false,
  loading: () => (
    <div className="tour-loading" role="status">
      Préparation de l’affichage immersif…
    </div>
  ),
});
export function ImmersiveViewer({ tour }: { tour: TourDto }) {
  const [sceneId, setSceneId] = useState(tour.scenes[0]?.id ?? ""),
    [mode, setMode] = useState<"panorama" | "model">(
      tour.scenes.length ? "panorama" : "model",
    ),
    [playing, setPlaying] = useState(false),
    [rooms, setRooms] = useState(false),
    [info, setInfo] = useState(""),
    [reset, setReset] = useState(0),
    [full, setFull] = useState(false),
    [fullError, setFullError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const index = Math.max(
      0,
      tour.scenes.findIndex((s) => s.id === sceneId),
    ),
    current = tour.scenes[index];
  function step(delta: number) {
    if (tour.scenes.length) {
      setSceneId(
        tour.scenes[(index + delta + tour.scenes.length) % tour.scenes.length]
          .id,
      );
      setMode("panorama");
      setInfo("");
    }
  }
  useEffect(() => {
    if (!playing || mode !== "panorama" || tour.scenes.length < 2) return;
    const timer = setInterval(() => {
      setSceneId((id) => {
        const i = tour.scenes.findIndex((s) => s.id === id);
        return tour.scenes[(i + 1) % tour.scenes.length].id;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, [playing, mode, tour.scenes]);
  useEffect(() => {
    const changed = () => {
      const active = document.fullscreenElement === ref.current;
      setFull(active);
      if (!active) setPlaying(false);
    };
    document.addEventListener("fullscreenchange", changed);
    const hidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (ref.current?.requestFullscreen)
        await ref.current.requestFullscreen();
      else throw new Error();
      setFullError("");
    } catch {
      setFullError("Le plein écran n’est pas disponible sur cet appareil.");
    }
  }
  return (
    <div className="tour-page">
      <div className="tour-heading">
        <Link href={tour.backHref}>
          <ArrowLeft size={18} />
          {tour.demo ? "Retour au catalogue" : "Retour à la fiche"}
        </Link>
        <div>
          <h1>{tour.title}</h1>
          <p>
            {tour.demo
              ? "Démonstration géométrique fictive · panoramas calculés et modèle schématique"
              : "Visite immersive"}
          </p>
        </div>
      </div>
      <div
        ref={ref}
        className={`immersive-frame ${full ? "is-fullscreen" : ""}`}
      >
        <div className="tour-room-title" aria-live="polite">
          {mode === "model" ? "Modèle 3D" : (current?.title ?? "Visite")}
        </div>
        <WebglView
          scene={current}
          modelUrl={mode === "model" ? (tour.modelUrl ?? undefined) : undefined}
          resetKey={reset}
          onHotspot={(target, label) => {
            setPlaying(false);
            if (target) {
              setSceneId(target);
              setInfo("");
            } else setInfo(label);
          }}
        />
        <div className="tour-mode-switch">
          {tour.scenes.length > 0 && (
            <button
              aria-pressed={mode === "panorama"}
              onClick={() => {
                setMode("panorama");
                setPlaying(false);
              }}
            >
              <ScanEye size={18} />
              360°
            </button>
          )}
          {tour.modelUrl && (
            <button
              aria-pressed={mode === "model"}
              onClick={() => {
                setMode("model");
                setPlaying(false);
              }}
            >
              <Box size={18} />
              Modèle 3D
            </button>
          )}
        </div>
        {mode === "panorama" && tour.scenes.length > 1 && (
          <>
            <button
              className="tour-arrow previous"
              onClick={() => {
                step(-1);
                setPlaying(false);
              }}
              aria-label="Pièce précédente"
            >
              <ChevronLeft />
            </button>
            <button
              className="tour-arrow next"
              onClick={() => {
                step(1);
                setPlaying(false);
              }}
              aria-label="Pièce suivante"
            >
              <ChevronRight />
            </button>
            <button
              className="tour-rooms-toggle"
              aria-expanded={rooms}
              onClick={() => setRooms(!rooms)}
            >
              <Layers size={18} />
              Pièces
            </button>
            <aside
              className={`tour-room-list ${rooms ? "open" : ""}`}
              aria-label="Pièces de la visite"
            >
              {tour.scenes.map((scene) => (
                <button
                  key={scene.id}
                  aria-pressed={current?.id === scene.id}
                  onClick={() => {
                    setSceneId(scene.id);
                    setPlaying(false);
                    setRooms(false);
                    setInfo("");
                  }}
                >
                  <span style={{ backgroundImage: `url("${scene.image}")` }} />
                  <strong>{scene.title}</strong>
                </button>
              ))}
            </aside>
          </>
        )}
        {mode === "panorama" && tour.floorPlanUrl && (
          <div className="tour-mini-plan">
            <Image
              src={tour.floorPlanUrl}
              alt="Plan du bien"
              width={240}
              height={140}
              unoptimized
            />
            {tour.scenes
              .filter((s) => s.planX !== null && s.planY !== null)
              .map((s) => (
                <button
                  key={s.id}
                  aria-label={`Sur le plan : ${s.title}`}
                  aria-pressed={s.id === current?.id}
                  style={{
                    left: `${s.planX! * 100}%`,
                    top: `${s.planY! * 100}%`,
                  }}
                  onClick={() => {
                    setSceneId(s.id);
                    setPlaying(false);
                  }}
                />
              ))}
          </div>
        )}
        {info && (
          <div
            className="tour-information"
            role="dialog"
            aria-label="Information de visite"
          >
            <p>{info}</p>
            <button
              onClick={() => setInfo("")}
              aria-label="Fermer l’information"
            >
              <X />
            </button>
          </div>
        )}
        <div className="tour-controls">
          {mode === "panorama" && tour.scenes.length > 1 && (
            <>
              <button onClick={() => step(-1)} aria-label="Scène précédente">
                <ChevronLeft />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                aria-label={
                  playing
                    ? "Arrêter la visite guidée"
                    : "Lancer la visite guidée"
                }
              >
                {playing ? <Pause /> : <Play />}
              </button>
              <button onClick={() => step(1)} aria-label="Scène suivante">
                <ChevronRight />
              </button>
              <span>
                {index + 1} / {tour.scenes.length}
              </span>
            </>
          )}
          <button
            aria-label="Réinitialiser la vue"
            onClick={() => setReset(reset + 1)}
          >
            <RotateCcw />
          </button>
          <button
            aria-label={
              full ? "Quitter le plein écran" : "Ouvrir en plein écran"
            }
            onClick={fullscreen}
          >
            {full ? <Minimize /> : <Expand />}
          </button>
        </div>
      </div>
      {fullError && <p role="status">{fullError}</p>}
      {tour.scenes.length > 0 && (
        <nav className="tour-filmstrip" aria-label="Vignettes des pièces">
          {tour.scenes.map((scene) => (
            <button
              key={scene.id}
              aria-pressed={mode === "panorama" && scene.id === current?.id}
              onClick={() => {
                setSceneId(scene.id);
                setMode("panorama");
                setPlaying(false);
                setInfo("");
              }}
            >
              <span style={{ backgroundImage: `url("${scene.image}")` }} />
              {scene.title}
            </button>
          ))}
        </nav>
      )}
      <p className="tour-help">
        {mode === "panorama"
          ? "Glissez pour regarder autour de vous. Au clavier : flèches pour orienter, + et − pour zoomer."
          : "Glissez pour faire pivoter le modèle. Pincez ou utilisez la molette pour zoomer. Au clavier : gauche/droite pour tourner, + et − pour zoomer."}
      </p>
    </div>
  );
}
