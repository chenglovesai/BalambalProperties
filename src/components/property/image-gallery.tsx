"use client";

import { useState, useCallback, useEffect, type SyntheticEvent } from "react";
import { ChevronLeft, ChevronRight, X, Expand, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FALLBACK_IMAGE = "/placeholder-property.svg";

function handleImgError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMAGE) {
    img.src = FALLBACK_IMAGE;
  }
}

interface ImageGalleryProps {
  images: string[];
  title: string;
  propertyType: string;
  buildingGrade: string | null;
  aiScore: number | null;
  videoTourUrl: string | null;
  floorPlanUrl: string | null;
  typeLabel: string;
  gradeColor: string;
}

export function ImageGallery({
  images,
  title,
  propertyType,
  buildingGrade,
  aiScore,
  videoTourUrl,
  floorPlanUrl,
  typeLabel,
  gradeColor,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const validImages = images.filter((img) => img.startsWith("http") && !img.includes("loadingphoto") && !img.includes("placeholder"));
  const allImages = validImages.length > 0 ? validImages : [FALLBACK_IMAGE];
  const hasFloorPlan = !!floorPlanUrl;
  const displayImages = hasFloorPlan ? [...allImages, floorPlanUrl!] : allImages;

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  }, [displayImages.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        {/* Hero Image */}
        <div
          className="relative aspect-[16/9] bg-muted cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <img
            src={allImages[0]}
            alt={title}
            onError={handleImgError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

          {/* Badges */}
          <div className="absolute left-4 top-4 flex gap-2">
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/90 text-foreground">
              {typeLabel}
            </Badge>
            {buildingGrade && (
              <Badge
                variant="outline"
                className={`backdrop-blur-sm border ${gradeColor}`}
              >
                Grade {buildingGrade}
              </Badge>
            )}
          </div>

          {aiScore != null && (
            <div className="absolute right-4 top-4">
              <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-sm">
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span className="text-sm font-bold text-primary">{aiScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
          )}

          {/* Expand hint */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            {videoTourUrl && (
              <a
                href={videoTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button size="sm" className="gap-1.5 bg-white/90 text-foreground backdrop-blur-sm hover:bg-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
                  </svg>
                  Video Tour
                </Button>
              </a>
            )}
          </div>
          <div className="absolute bottom-4 right-4">
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5 bg-white/90 text-foreground backdrop-blur-sm hover:bg-white"
            >
              <Expand className="h-4 w-4" />
              {displayImages.length} photos
            </Button>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {displayImages.slice(1, 6).map((img, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i + 1)}
                className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary group"
              >
                <img
                  src={img}
                  alt={
                    hasFloorPlan && i + 1 === displayImages.length - 1
                      ? "Floor Plan"
                      : `View ${i + 2}`
                  }
                  onError={handleImgError}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                {hasFloorPlan && i + 1 === allImages.length && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-xs font-medium text-white">Floor Plan</span>
                  </div>
                )}
                {displayImages.length > 6 && i === 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-sm font-semibold text-white">
                      +{displayImages.length - 6}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-in fade-in duration-200">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {currentIndex + 1} / {displayImages.length}
            {hasFloorPlan && currentIndex === displayImages.length - 1 && (
              <span className="ml-2 text-white/70">— Floor Plan</span>
            )}
          </div>

          {/* Previous */}
          {displayImages.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div className="flex h-full w-full items-center justify-center px-16 py-16">
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              onError={handleImgError}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Next */}
          {displayImages.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Thumbnail strip at bottom */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-xl bg-black/50 p-2 backdrop-blur-sm overflow-x-auto max-w-[90vw]">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                    i === currentIndex
                      ? "ring-2 ring-white opacity-100"
                      : "opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    onError={handleImgError}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
