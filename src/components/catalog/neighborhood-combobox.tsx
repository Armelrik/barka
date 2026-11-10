"use client";
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { normalizeLocation } from "@/modules/catalog/query";
import type { NeighborhoodOption } from "@/modules/catalog/locations";
export function NeighborhoodCombobox({
  value,
  city,
  options,
  onChange,
  onSelect,
}: {
  value: string;
  city: string;
  options: NeighborhoodOption[];
  onChange: (value: string) => void;
  onSelect: (option: NeighborhoodOption) => void;
}) {
  const id = useId(),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const matches = options
    .filter(
      (o) =>
        (!city || normalizeLocation(o.city) === normalizeLocation(city)) &&
        [o.name, ...(o.aliases ?? [])].some((name) =>
          normalizeLocation(name).includes(normalizeLocation(value)),
        ),
    )
    .slice(0, 120);
  const index = Math.min(active, Math.max(0, matches.length - 1));
  function choose(option: NeighborhoodOption) {
    onSelect(option);
    setOpen(false);
  }
  return (
    <div
      className="neighborhood-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label htmlFor={id}>Quartier</label>
      <div className="neighborhood-input">
        <input
          id={id}
          name="location"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            open && matches.length ? `${id}-${index}` : undefined
          }
          autoComplete="off"
          value={value}
          maxLength={100}
          placeholder="Choisir ou rechercher"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((v) =>
                e.key === "ArrowDown"
                  ? Math.min(v + 1, matches.length - 1)
                  : Math.max(0, v - 1),
              );
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            }
            if (e.key === "Enter" && open && matches[index]) {
              e.preventDefault();
              choose(matches[index]);
            }
          }}
        />
        <button
          type="button"
          aria-label={open ? "Fermer les quartiers" : "Afficher les quartiers"}
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {open && (
        <div className="neighborhood-dropdown">
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label="Quartiers disponibles"
          >
            {matches.map((option, i) => (
              <li
                role="option"
                id={`${id}-${i}`}
                key={`${option.city}:${option.name}`}
                aria-selected={i === index}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>{option.name}</span>
                {!city && <small>{option.city}</small>}
              </li>
            ))}
          </ul>
          {!matches.length && (
            <p role="status">
              Aucun quartier trouvé. Vous pouvez rechercher le nom saisi.
            </p>
          )}
          <button
            type="button"
            className="text-link"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Tous les quartiers
          </button>
        </div>
      )}
    </div>
  );
}
