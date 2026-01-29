"use client";

import { useState, useEffect } from "react";

interface ExtractedColors {
  dominant: string | null;
  palette: string[];
  gradient: string | null;
  borderColor: string | null;
}

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

            // Border color - semi-transparent version of dominant color
            const borderColor = `rgba(${dominant[0]}, ${dominant[1]}, ${dominant[2]}, 0.5)`;

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
