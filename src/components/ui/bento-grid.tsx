"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BentoItem {
  title: string;
  description: string;
  icon: ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-3", className)}>
      {items.map((item, index) => (
        <article
          key={`${item.title}-${index}`}
          className={cn(
            "group relative overflow-hidden rounded-[1.2rem] p-5 transition-all duration-300",
            "border border-white/10 bg-white/[0.022]",
            "hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.038]",
            "hover:shadow-[0_16px_44px_rgba(0,0,0,0.22)] will-change-transform",
            item.colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
            {
              "-translate-y-0.5 border-white/18 bg-white/[0.035] shadow-[0_16px_44px_rgba(0,0,0,0.2)]":
                item.hasPersistentHover,
            },
          )}
        >
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              item.hasPersistentHover ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:4px_4px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(212,164,84,0.13),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(117,183,187,0.1),transparent_34%)]" />
          </div>

          <div className="relative flex min-h-[178px] flex-col justify-between gap-7">
            <div className="flex items-center justify-between gap-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-white/74 transition duration-300 group-hover:border-white/18 group-hover:bg-white/[0.08] group-hover:text-white">
                {item.icon}
              </div>
              <span className="rounded-lg border border-white/8 bg-white/[0.045] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/48 backdrop-blur-sm transition group-hover:text-white/70">
                {item.status || "Active"}
              </span>
            </div>

            <div>
              <h3 className="font-display text-2xl font-semibold leading-tight text-white md:text-3xl">
                {item.title}
                {item.meta && (
                  <span className="ml-2 align-middle text-[11px] font-medium uppercase tracking-[0.13em] text-[#d4a454]/80">
                    {item.meta}
                  </span>
                )}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/56">{item.description}</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {item.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/8 bg-white/[0.045] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/42 transition group-hover:border-white/12 group-hover:text-white/62"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#75b7bb] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {item.cta || "Explore ->"}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[1.2rem] ring-1 ring-inset ring-white/12 transition-opacity duration-300",
              item.hasPersistentHover ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          />
        </article>
      ))}
    </div>
  );
}

export { BentoGrid };
