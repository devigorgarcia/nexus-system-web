"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = {
  value: string;
  label: string;
  unitType?: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  valueLabel?: string;
  onChange: (value: string, option: SearchableOption | null) => void;
  fetchOptions: (query: string) => Promise<SearchableOption[]>;
  placeholder?: string;
  emptyOption?: SearchableOption;
  createLabel?: string;
  onCreate?: () => void;
  disabled?: boolean;
  size?: "sm" | "default";
  className?: string;
  "aria-label"?: string;
};

const SEARCH_DEBOUNCE_MS = 300;

export function SearchableSelect({
  id,
  value,
  valueLabel,
  onChange,
  fetchOptions,
  placeholder = "Selecione",
  emptyOption,
  createLabel,
  onCreate,
  disabled,
  size = "default",
  className,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedQuery(query),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void fetchOptions(debouncedQuery)
      .then((items) => {
        if (!cancelled) setOptions(items);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery, fetchOptions]);

  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 240 && rect.top > spaceBelow;
      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        zIndex: 80,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selectedLabel =
    valueLabel ||
    options.find((option) => option.value === value)?.label ||
    (emptyOption && value === emptyOption.value ? emptyOption.label : "") ||
    placeholder;

  function selectOption(option: SearchableOption | null, nextValue: string) {
    onChange(nextValue, option);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-card py-2 pr-3 pl-3.5 text-left text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-8" : "h-10",
          !value && "text-muted-foreground",
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            style={menuStyle}
            className="overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
          >
            <div className="relative border-b border-border">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar…"
                className="h-9 w-full bg-transparent pr-3 pl-8 text-sm outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1">
              {createLabel && onCreate && (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-accent"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onCreate();
                  }}
                >
                  <Plus className="size-3.5" />
                  {createLabel}
                </button>
              )}
              {emptyOption && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === emptyOption.value || !value}
                  className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => selectOption(emptyOption, emptyOption.value)}
                >
                  {emptyOption.label}
                </button>
              )}
              {loading && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Buscando…
                </p>
              )}
              {!loading && options.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  Nenhum resultado.
                </p>
              )}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                    option.value === value && "bg-accent",
                  )}
                  onClick={() => selectOption(option, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
