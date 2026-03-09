import React, { useState, useEffect } from "react";
import axios from "axios";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function AddressAutocomplete({ value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }

    const fetchPlaces = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
          {
            params: {
              access_token: MAPBOX_TOKEN,
              autocomplete: true,
              limit: 5,
              country: "IN"
            }
          }
        );
        setResults(res.data.features);
      } catch (err) {
        console.error(err);
      } finally {
    setLoading(false);}
    };

    const debounce = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />

     {(results.length > 0 || loading || query.length >= 3) && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: "var(--bg-card)",
      border: "1px solid var(--bg-border)",
      borderRadius: 12,
      boxShadow: "var(--shadow)",
      zIndex: 1000,
      overflow: "hidden",
      maxHeight: 260,
      overflowY: "auto"
    }}
  >

    {/* 🔄 Loading */}
    {loading && (
      <div style={{ padding: 14, textAlign: "center", fontSize: 13 }}>
        <span className="spinner" /> Searching...
      </div>
    )}

    {/* ❌ No Results */}
    {!loading && results.length === 0 && query.length >= 3 && (
      <div style={{ padding: 14, fontSize: 13, color: "var(--text-muted)" }}>
        No results found
      </div>
    )}

    {/* ✅ Results */}
    {results.map((place) => {
      const highlightMatch = (text, query) => {
        const regex = new RegExp(`(${query})`, "gi");
        return text.replace(regex, "<strong>$1</strong>");
      };

      return (
        <div
          key={place.id}
          style={{
            padding: "12px 14px",
            cursor: "pointer",
            borderBottom: "1px solid var(--bg-border)",
            color: "var(--text)",
            fontSize: 13,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            transition: "background 0.15s ease"
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-card2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }

          // 🔥 FIX DOUBLE CLICK HERE
          onMouseDown={(e) => {
            e.preventDefault();

            const [lng, lat] = place.center;

            onSelect({
              address: place.place_name,
              lat,
              lng
            });

            setQuery(place.place_name);
            setResults([]);
          }}
        >
          {/* 📍 Location Icon */}
          <div style={{ fontSize: 16, marginTop: 2 }}>📍</div>

          {/* Highlighted Text */}
          <div
            dangerouslySetInnerHTML={{
              __html: highlightMatch(place.place_name, query)
            }}
          />
        </div>
      );
    })}
  </div>
)}
    </div>
  );
}