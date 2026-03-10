import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function AddressAutocomplete({ value, onSelect, placeholder }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);       
  const [selected, setSelected] = useState(false);  
  const [activeIndex, setActiveIndex] = useState(-1); 
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  //  Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setResults([]);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
      setSelected(true);
    }
  }, [value]);

  // Fetch places with debounce
  useEffect(() => {
    // Don't search if user just selected a result
    if (selected) return;
    if (!query || query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const fetchPlaces = async () => {
      try {
        setLoading(true);
        setIsOpen(true);
        const res = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
          {
            params: {
              access_token: MAPBOX_TOKEN,
              autocomplete: true,
              limit: 6,
              country: "IN",
              types: "country,region,postcode,district,place,locality,neighborhood,address,poi,poi.landmark"            },
          }
        );
        setResults(res.data.features);
        setActiveIndex(-1);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(debounce);
  }, [query, selected]);

  const handleSelect = useCallback((place) => {
    const [lng, lat] = place.center;
    onSelect({ address: place.place_name, lat, lng });
    setQuery(place.place_name);
    setResults([]);
    setIsOpen(false);          
    setSelected(true);        
    setActiveIndex(-1);
  }, [onSelect]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setSelected(false);        
    if (e.target.value.length < 3) {
      setIsOpen(false);
      setResults([]);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelected(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
    onSelect({ address: "", lat: null, lng: null });
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setResults([]);
      setActiveIndex(-1);
    }
  };

  const highlightMatch = (text, q) => {
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, "<mark style='background:rgba(255,77,0,0.2);color:var(--primary);border-radius:2px;padding:0 1px;'>$1</mark>");
  };

  // Get place type icon
  const getPlaceIcon = (placeType) => {
    if (!placeType) return "📍";
    const type = placeType[0];
    const icons = { poi: "🏢", address: "🏠", neighborhood: "🏘️", locality: "🌆", place: "📍", region: "🗺️" };
    return icons[type] || "📍";
  };

  // Get place category label
  const getPlaceCategory = (place) => {
    const type = place.place_type?.[0];
    const labels = { poi: "Place", address: "Address", neighborhood: "Area", locality: "Locality", place: "City", region: "Region" };
    return labels[type] || "";
  };

  const showDropdown = isOpen && !selected && (loading || results.length > 0 || query.length >= 3);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Input wrapper with clear button */}
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Re-open if there are cached results and not selected
            if (!selected && results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingRight: query ? 32 : 12 }}
        />

        {query && (
          <button
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-muted)", fontSize: 16, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 20, height: 20, borderRadius: "50%",
              transition: "background 0.15s",
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-border)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border)",
            borderRadius: 12,
            boxShadow: "var(--shadow)",
            zIndex: 1000,
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {/* Loading state */}
          {loading && (
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)" }}>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Searching for "{query}"...
            </div>
          )}

          {/* No results */}
          {!loading && results.length === 0 && query.length >= 3 && (
            <div style={{ padding: "14px 16px", fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              No results for "<strong>{query}</strong>"
            </div>
          )}

          {/* Results list */}
          {!loading && results.map((place, index) => (
            <div
              key={place.id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(place);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              style={{
                padding: "11px 14px",
                cursor: "pointer",
                borderBottom: index < results.length - 1 ? "1px solid var(--bg-border)" : "none",
                background: activeIndex === index ? "var(--bg-card2)" : "transparent",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                transition: "background 0.1s ease",
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: 15, marginTop: 2, flexShrink: 0, opacity: 0.85 }}>
                {getPlaceIcon(place.place_type)}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Primary name (first part before comma) */}
                <div
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(
                      place.text || place.place_name.split(",")[0],
                      query
                    ),
                  }}
                />
                {/* Full address (secondary) */}
                <div
                  style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {place.place_name}
                </div>
              </div>

              {/* Category badge */}
              <div style={{
                fontSize: 10, color: "var(--text-muted)", background: "var(--bg-border)",
                borderRadius: 6, padding: "2px 6px", flexShrink: 0, alignSelf: "center",
                fontWeight: 500, letterSpacing: 0.3, textTransform: "uppercase",
              }}>
                {getPlaceCategory(place)}
              </div>

              {/* Keyboard active indicator */}
              {activeIndex === index && (
                <div style={{ alignSelf: "center", color: "var(--text-muted)", fontSize: 11, flexShrink: 0 }}>↵</div>
              )}
            </div>
          ))}

          {/* Footer hint */}
          {!loading && results.length > 0 && (
            <div style={{
              padding: "8px 14px", fontSize: 11, color: "var(--text-muted)",
              background: "var(--bg-card2)", borderTop: "1px solid var(--bg-border)",
              display: "flex", gap: 12,
            }}>
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>Esc close</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}