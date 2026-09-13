"use client";

import { KEY_ORDER } from "@/lib/music/keys";
import { ChevronDown } from "lucide-react";

interface KeySelectorProps {
  value: string;
  onChange: (key: string) => void;
  label?: string;
  id?: string;
}

/** Dropdown listing the 12 explicit target keys (C, flats, sharps). */
export function KeySelector({ value, onChange, label = "Key", id }: KeySelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 appearance-none rounded-md border border-zinc-300 bg-white py-1.5 pl-3 pr-8 font-medium dark:border-zinc-700 dark:bg-zinc-900"
        >
          {KEY_ORDER.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
          aria-hidden
        />
      </span>
    </label>
  );
}
