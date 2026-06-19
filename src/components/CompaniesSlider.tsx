import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { useCompanies } from "@/lib/companies";

export function CompaniesSlider() {
  const { data: companies = [] } = useCompanies();
  if (companies.length === 0) return null;

  return (
    <section aria-labelledby="companies-heading" className="py-10">
      <p id="companies-heading" className="section-label mb-6 text-center">Companies & Clients</p>
      <div className="relative h-24 overflow-hidden">
        <InfiniteSlider className="flex h-full items-center" duration={32} gap={64}>
          {companies.map((company) => {
            const logo = company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="max-h-12 w-auto max-w-40 object-contain opacity-65 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0" />
            ) : (
              <span className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:border-white/20 hover:text-white/70">
                {company.name}
              </span>
            );
            return <div key={company.id} className="flex h-20 w-44 shrink-0 items-center justify-center">{company.websiteUrl ? <a href={company.websiteUrl} target="_blank" rel="noreferrer" aria-label={company.name}>{logo}</a> : logo}</div>;
          })}
        </InfiniteSlider>
        <ProgressiveBlur className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[#0b0f0f]/30" direction="left" />
        <ProgressiveBlur className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-[#0b0f0f]/30" direction="right" />
      </div>
    </section>
  );
}
