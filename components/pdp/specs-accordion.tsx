import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface SpecsAccordionProps {
  specs: Record<string, string>;
  /** Localised section heading, passed in from the page (which already holds a translator). */
  label: string;
}

export function SpecsAccordion({ specs, label }: SpecsAccordionProps) {
  return (
    <Accordion defaultValue={["specs"]}>
      <AccordionItem value="specs">
        <AccordionTrigger>{label}</AccordionTrigger>
        <AccordionContent>
          <dl className="divide-y divide-[var(--color-iron)]">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 py-3">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-mint)]" aria-hidden />
                <dt className="w-32 flex-shrink-0 text-sm font-semibold text-ceramic">{key}</dt>
                <dd className="text-sm text-slate">{value}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
