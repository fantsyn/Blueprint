"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PhotoPose } from "@/types";
import { Camera, Check, ImageIcon, User } from "lucide-react";

interface PhotoUploadSlotProps {
  pose: PhotoPose;
  value?: string;
  onChange: (dataUrl: string) => void;
}

const POSE_HINTS: Record<PhotoPose, string> = {
  front: "Face camera, arms slightly out, natural stance",
  side: "Profile view, arms relaxed at sides",
  back: "Back to camera, arms slightly out",
};

const POSE_LABEL: Record<PhotoPose, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
};

/** Resize/compress so previews stay light in memory */
function compressImage(
  file: File,
  maxEdge = 720,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

export function PhotoUploadSlot({
  pose,
  value,
  onChange,
}: PhotoUploadSlotProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onChange(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setBusy(false);
      // Allow re-selecting the same file
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary">
          {POSE_LABEL[pose]}
        </span>
        {value && (
          <span className="flex items-center gap-1 text-[11px] text-cyan">
            <Check className="h-3 w-3" />
            Added
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        disabled={busy}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-lg)]",
          "border border-dashed transition-all duration-200",
          "flex flex-col items-center justify-center gap-2",
          value
            ? "border-cyan/30 bg-elevated"
            : "border-border hover:border-steel bg-void/50",
          dragging && "border-cyan/50 bg-cyan-soft",
          busy && "opacity-60"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={`${pose} physique`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <svg
                viewBox="0 0 80 160"
                className="h-3/5 w-auto"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                {pose === "side" ? (
                  <path d="M40 20 C35 20 32 28 34 36 L30 50 L28 80 L32 90 L30 120 L34 150 L46 150 L48 120 L46 90 L50 80 L48 50 L44 36 C46 28 45 20 40 20 Z" />
                ) : (
                  <path d="M40 18 C32 18 28 28 30 36 L22 50 L18 90 L28 95 L26 130 L32 155 L48 155 L54 130 L52 95 L62 90 L58 50 L50 36 C52 28 48 18 40 18 Z" />
                )}
              </svg>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-2 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-elevated">
                {pose === "front" ? (
                  <User className="h-4 w-4 text-steel" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-steel" />
                )}
              </div>
              <span className="text-[11px] text-tertiary text-center leading-snug">
                {busy ? "Processing…" : "Gallery"}
              </span>
            </div>
          </>
        )}

        {value && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 pointer-events-none">
            <span className="text-[11px] text-white/80">Tap to replace</span>
          </div>
        )}
      </button>

      {/* Explicit source actions — gallery default, camera optional */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryRef.current?.click()}
          className={cn(
            "flex items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-border",
            "bg-elevated/80 px-1.5 py-1.5 text-[10px] text-secondary",
            "hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-40"
          )}
        >
          <ImageIcon className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          Library
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className={cn(
            "flex items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-border",
            "bg-elevated/80 px-1.5 py-1.5 text-[10px] text-secondary",
            "hover:border-cyan/30 hover:text-cyan transition-colors disabled:opacity-40"
          )}
        >
          <Camera className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          Camera
        </button>
      </div>

      <p className="text-[11px] text-muted leading-snug">{POSE_HINTS[pose]}</p>

      {/* Gallery / files — no capture attribute so mobile opens photo library */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {/* Camera only when user picks Camera */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
