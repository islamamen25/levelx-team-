interface OverviewProps {
  /** Free-text product description; may contain blank-line paragraph breaks. */
  description: string;
  /** Localised section heading, passed in so this stays a sync presentational component. */
  label: string;
}

/**
 * Renders the full product description (`products.description`, or the per-locale
 * `product_translations.description`) on the PDP. Until this component existed the
 * description was written to the DB and fetched by `getProductBySlug` but never
 * shown — only the specs table rendered.
 *
 * The catalog pipeline writes plain text with a blank line between paragraphs, so
 * split on those; `whitespace-pre-line` keeps any single newlines inside a
 * paragraph (some rows run a "المزايا:" list on one block).
 */
export function Overview({ description, label }: OverviewProps) {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <section className="mt-12 max-w-2xl" aria-label={label}>
      <h2
        className="text-ceramic"
        style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)", fontWeight: 700, letterSpacing: "-0.01em" }}
      >
        {label}
      </h2>
      <div className="mt-4 space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
