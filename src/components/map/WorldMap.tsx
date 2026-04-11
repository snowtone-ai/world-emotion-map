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

export default function WorldMap({ colorMap }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [colorMap]);

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
