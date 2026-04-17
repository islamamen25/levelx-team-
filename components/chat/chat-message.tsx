"use client";

import { Link } from "@/i18n/navigation";
import { Star } from "lucide-react";
import type { UIMessage } from "ai";

function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

interface ProductResult {
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
}

export function ChatMessage({ message, locale }: { message: UIMessage; locale: string }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[var(--color-mint)] text-white"
            : "bg-[var(--color-obsidian)] text-[var(--color-ceramic)]",
        ].join(" ")}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="whitespace-pre-wrap">
                {part.text}
              </p>
            );
          }

          // Handle tool results generically
          if ("toolName" in part && part.toolName === "search_products") {
            const toolPart = part as { state: string; output?: { products: ProductResult[] } };
            if (toolPart.state === "output-available" && toolPart.output?.products?.length) {
              return (
                <div key={i} className="mt-2 flex flex-col gap-2">
                  {toolPart.output.products.map((p: ProductResult) => (
                    <Link
                      key={p.slug}
                      href={`/products/${p.slug}`}
                      locale={locale as "en" | "ar"}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-iron)] bg-white p-2.5 transition-colors hover:border-[var(--color-mint)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-obsidian)] text-lg">
                        📱
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-semibold text-[var(--color-ceramic)]">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-ceramic)]">{formatGBP(p.price)}</span>
                          <span className="text-[10px] text-[var(--color-slate)] line-through">{formatGBP(p.originalPrice)}</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-[var(--color-slate)]">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                            {p.rating}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            }
            if (toolPart.state !== "output-available") {
              return (
                <p key={i} className="text-xs italic text-[var(--color-slate)]">
                  Searching products...
                </p>
              );
            }
          }

          return null;
        })}
      </div>
    </div>
  );
}
