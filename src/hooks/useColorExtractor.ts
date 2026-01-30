"use client";

import { useState, useEffect } from "react";

interface ExtractedColors {
  dominant: string | null;
  palette: string[];
  gradient: string | null;
  borderColor: string | null;
}

// WCAG relative luminance calculation
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const srgb = c / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// WCAG contrast ratio calculation
function getContrastRatio(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Background color approximation (dark slate background ~rgb(15, 23, 42) with card overlay)
// The card has bg-slate-900/40 overlay, so effective background is darker
const BG_COLOR = { r: 20, g: 30, b: 50 };

// Minimum contrast ratio for graphical elements (WCAG 2.1 Level AA)
const MIN_CONTRAST_RATIO = 3;

// Neutral gray fallback for low contrast borders
const NEUTRAL_BORDER = "rgba(100, 116, 139, 0.5)"; // slate-500 at 50% opacity

export function useColorExtractor(
  imageUrl: string | null | undefined,
): ExtractedColors {
  const [colors, setColors] = useState<ExtractedColors>({
    dominant: null,
    palette: [],
    gradient: null,
    borderColor: null,
  });

  useEffect(() => {
    if (!imageUrl) {
      setColors({ dominant: null, palette: [], gradient: null, borderColor: null });
      return;
    }

    let isMounted = true;

    async function extractColors() {
      try {
        // Dynamically import ColorThief (it only works in browser)
        const ColorThief = (await import("colorthief")).default;
        const colorThief = new ColorThief();

        // Create an image element
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          if (!isMounted) return;

          try {
            // Get dominant color
            const dominant = colorThief.getColor(img);
            const dominantRgb = `rgb(${dominant[0]}, ${dominant[1]}, ${dominant[2]})`;

            // Get color palette (5 colors)
            const palette = colorThief.getPalette(img, 5);
            const paletteRgb = palette.map(
              (color: number[]) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
            );

            // Create gradient from first two palette colors
            const color1 = palette[0];
            const color2 = palette[1] || palette[0];

            // Make colors slightly transparent for better text readability
            const gradientColor1 = `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.3)`;
            const gradientColor2 = `rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.15)`;

            const gradient = `linear-gradient(135deg, ${gradientColor1} 0%, ${gradientColor2} 100%)`;

            // Border color - check contrast against background
            // Use the border color at full opacity for contrast calculation
            const contrastRatio = getContrastRatio(
              dominant[0], dominant[1], dominant[2],
              BG_COLOR.r, BG_COLOR.g, BG_COLOR.b
            );

            // Use extracted color if contrast is sufficient, otherwise use neutral gray
            const borderColor = contrastRatio >= MIN_CONTRAST_RATIO
              ? `rgba(${dominant[0]}, ${dominant[1]}, ${dominant[2]}, 0.5)`
              : NEUTRAL_BORDER;

            setColors({
              dominant: dominantRgb,
              palette: paletteRgb,
              gradient,
              borderColor,
            });
          } catch (err) {
            console.error("Failed to extract colors:", err);
            setColors({ dominant: null, palette: [], gradient: null, borderColor: null });
          }
        };

        img.onerror = () => {
          if (!isMounted) return;
          setColors({ dominant: null, palette: [], gradient: null, borderColor: null });
        };

        img.src = imageUrl as string;
      } catch (err) {
        console.error("Failed to load ColorThief:", err);
        setColors({ dominant: null, palette: [], gradient: null, borderColor: null });
      }
    }

    extractColors();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return colors;
}
