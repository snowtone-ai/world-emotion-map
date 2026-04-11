"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const NO_DATA_COLOR = "#1a1a2e";
const COUNTRY_OUTLINE_COLOR = "#334155";

// ── Types ──────────────────────────────────────────────────────────────────

type Props = {
  /** country code (ISO alpha-2) → fill color hex */
  colorMap: Record<string, string>;
  onCountrySelect: (countryCode: string) => void;
  selectedCountry: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function buildFillColor(
  colorMap: Record<string, string>
): mapboxgl.ExpressionSpecification | string {
  const entries = Object.entries(colorMap);
  if (entries.length === 0) return NO_DATA_COLOR;
  return [
    "match",
    ["get", "iso_3166_1_alpha_2"],
    ...entries.flatMap(([code, color]) => [code, color]),
    NO_DATA_COLOR,
  ] as mapboxgl.ExpressionSpecification;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WorldMap({ colorMap, onCountrySelect, selectedCountry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Hold latest callback in a ref to avoid stale closures inside Mapbox event handlers
  const onCountrySelectRef = useRef(onCountrySelect);
  useEffect(() => {
    onCountrySelectRef.current = onCountrySelect;
  }, [onCountrySelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    // Clean up any previous instance before creating a new one
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: "globe",
      center: [10, 20],
      zoom: 1.5,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(10, 10, 30)",
        "high-color": "rgb(20, 10, 50)",
        "horizon-blend": 0.02,
        "space-color": "rgb(4, 4, 15)",
        "star-intensity": 0.6,
      });

      map.addSource("country-boundaries", {
        type: "vector",
        url: "mapbox://mapbox.country-boundaries-v1",
      });

      map.addLayer(
        {
          id: "country-fill",
          type: "fill",
          source: "country-boundaries",
          "source-layer": "country_boundaries",
          filter: ["==", ["get", "disputed"], "false"],
          paint: {
            "fill-color": buildFillColor(colorMap),
            "fill-opacity": 0.72,
          },
        },
        "country-label"
      );

      map.addLayer(
        {
          id: "country-outline",
          type: "line",
          source: "country-boundaries",
          "source-layer": "country_boundaries",
          paint: {
            "line-color": COUNTRY_OUTLINE_COLOR,
            "line-width": 0.4,
          },
        },
        "country-label"
      );

      map.addLayer(
        {
          id: "country-highlight",
          type: "line",
          source: "country-boundaries",
          "source-layer": "country_boundaries",
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
            "line-blur": 4,
            "line-opacity": 0,
          },
        } as mapboxgl.LayerSpecification,
        "country-label"
      );

      // Click: use queryRenderedFeatures for robustness
      // (layer-specific click may miss if the disputed filter eliminates features)
      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["country-fill"],
        });
        const code = features[0]?.properties?.[
          "iso_3166_1_alpha_2"
        ] as string | undefined;
        if (code) onCountrySelectRef.current(code);
      });

      // Cursor affordance
      map.on("mouseenter", "country-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "country-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [colorMap]);

  // Separate effect: update highlight layer when selectedCountry changes
  // (kept separate from colorMap effect to avoid full map re-initialization)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("country-highlight")) return;
    map.setPaintProperty("country-highlight", "line-opacity", [
      "case",
      ["==", ["get", "iso_3166_1_alpha_2"], selectedCountry ?? ""],
      0.85,
      0,
    ]);
  }, [selectedCountry]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-[var(--wem-text-muted)]">
          NEXT_PUBLIC_MAPBOX_TOKEN is not set
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full"
      style={{ minHeight: 0 }}
    />
  );
}
