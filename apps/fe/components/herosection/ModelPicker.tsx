"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Bot,
  BrainCircuit,
  ChevronDown,
  Cpu,
  Gem,
  Infinity as InfinityIcon,
  Search,
  Star,
  Wind,
} from "lucide-react";

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: { prompt?: string; completion?: string };
}

interface ModelPickerProps {
  model: string;
  onSelect: (modelId: string) => void;
  triggerClassName?: string;
}

const PROVIDER_META: Record<string, { label: string; icon: typeof Bot }> = {
  openai: { label: "OpenAI", icon: Bot },
  anthropic: { label: "Anthropic", icon: BrainCircuit },
  google: { label: "Google", icon: Gem },
  mistralai: { label: "Mistral", icon: Wind },
  "meta-llama": { label: "Meta", icon: InfinityIcon },
};

const RECOMMENDED_PREFIXES = ["anthropic/", "openai/", "google/", "mistralai/"];

function getProviderKey(id: string) {
  return id.split("/")[0] ?? "other";
}

function getProviderMeta(key: string) {
  return (
    PROVIDER_META[key] ?? {
      label: key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: Cpu,
    }
  );
}

function getPriceTier(m: OpenRouterModel): string {
  const prompt = parseFloat(m.pricing?.prompt ?? "0");
  if (m.id.endsWith(":free") || prompt === 0) return "Free";
  if (prompt < 0.000001) return "$";
  if (prompt < 0.00001) return "$$";
  return "$$$";
}

export default function ModelPicker({ model, onSelect, triggerClassName }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("recommended");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("https://openrouter.ai/api/v1/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          const sorted = (data.data as OpenRouterModel[])
            .map((m) => ({ id: m.id, name: m.name, description: m.description, pricing: m.pricing }))
            .sort((a, b) => a.id.localeCompare(b.id));
          setModels(sorted);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const providers = Array.from(new Set(models.map((m) => getProviderKey(m.id)))).sort((a, b) => {
    const aIdx = RECOMMENDED_PREFIXES.findIndex((p) => p.startsWith(`${a}/`));
    const bIdx = RECOMMENDED_PREFIXES.findIndex((p) => p.startsWith(`${b}/`));
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  const recommendedModels = RECOMMENDED_PREFIXES.flatMap((prefix) =>
    models.filter((m) => m.id.startsWith(prefix)).slice(0, 2)
  );

  const isSearching = query.trim().length > 0;
  const searchResults = isSearching
    ? models
        .filter(
          (m) =>
            m.id.toLowerCase().includes(query.toLowerCase()) ||
            m.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 40)
    : null;

  const visibleModels =
    activeCategory === "recommended"
      ? recommendedModels
      : models.filter((m) => getProviderKey(m.id) === activeCategory).slice(0, 40);

  const rowsToRender = isSearching ? searchResults! : visibleModels;
  const selectedName = model.split("/").pop()?.replace(":free", "") || "Select model";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-md bg-white/15 px-2.5 py-1 text-xs font-nav font-medium text-white transition-colors hover:bg-white/25",
          triggerClassName
        )}
      >
        <BrainCircuit className="h-3.5 w-3.5" />
        <span className="max-w-[120px] truncate">{selectedName}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 flex max-h-[28rem] w-[420px] max-w-[90vw] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
          {/* Search */}
          <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="h-7 border-0 bg-transparent p-0 font-body text-xs shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Category rail */}
            {!isSearching && (
              <div className="flex w-11 shrink-0 flex-col items-center gap-3 border-r border-neutral-200 py-3 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setActiveCategory("recommended")}
                  title="Recommended"
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    activeCategory === "recommended"
                      ? "bg-[#4a3294]/10 text-[#4a3294]"
                      : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <Star className="h-4 w-4" />
                </button>
                {providers.map((key) => {
                  const meta = getProviderMeta(key);
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      title={meta.label}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        activeCategory === key
                          ? "bg-[#4a3294]/10 text-[#4a3294]"
                          : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Model list */}
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {models.length === 0 ? (
                <p className="px-3 py-6 text-center font-body text-xs text-neutral-500 dark:text-neutral-400">
                  Loading models...
                </p>
              ) : (
                <>
                  {!isSearching && (
                    <p className="px-2 pb-1 pt-1 font-nav text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {activeCategory === "recommended" ? "Recommended" : getProviderMeta(activeCategory).label}
                    </p>
                  )}
                  {rowsToRender.length === 0 ? (
                    <p className="px-3 py-6 text-center font-body text-xs text-neutral-500 dark:text-neutral-400">
                      No models found
                    </p>
                  ) : (
                    rowsToRender.map((m) => {
                      const meta = getProviderMeta(getProviderKey(m.id));
                      const Icon = meta.icon;
                      const isRecommended = RECOMMENDED_PREFIXES.some((p) => m.id.startsWith(p));
                      const tier = getPriceTier(m);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onSelect(m.id);
                            setOpen(false);
                            setQuery("");
                          }}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            model === m.id && "bg-neutral-100 dark:bg-neutral-800"
                          )}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate font-nav text-xs font-medium text-neutral-900 dark:text-white">
                                {m.name}
                              </span>
                              {isRecommended && (
                                <Star className="h-3 w-3 shrink-0 fill-[#4a3294] text-[#4a3294]" />
                              )}
                            </span>
                            {m.description && (
                              <span className="line-clamp-1 font-body text-[11px] text-neutral-500 dark:text-neutral-400">
                                {m.description}
                              </span>
                            )}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-1.5 py-0.5 font-nav text-[10px] font-medium",
                              tier === "Free"
                                ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                                : "bg-[#4a3294]/10 text-[#4a3294]"
                            )}
                          >
                            {tier}
                          </span>
                        </button>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
