import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckSquare,
  Film,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Play,
  Rocket,
  Smartphone,
  Video,
} from "lucide-react";
import { useListMedia, type Media } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MediaDetailModal } from "@/components/ui/MediaDetailModal";
import InteractiveBentoGallery, { type BentoGalleryItem } from "@/components/ui/interactive-bento-gallery";
import { Component as EtheralShadow } from "@/components/ui/etheral-shadow";
import { CompaniesSlider } from "@/components/CompaniesSlider";
import { applySeo, defaultSiteSettings, useSiteSettings } from "@/lib/siteSettings";
import { usePortfolioCategories } from "@/lib/categories";

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

const services = [
  [Video, "Videography", "Cinematic production for brands, events, documentaries, and campaigns."],
  [Camera, "Photography", "Commercial, portrait, product, and event photography with clear intent."],
  [Palette, "Graphic Design", "Visual identity, branding, and marketing materials that communicate clearly."],
  [Smartphone, "Social Media Content", "Short-form strategy and production tailored for every platform."],
] as const;

const process = [
  [BriefcaseBusiness, "01", "Discover", "We discuss your goals, audience, and key message."],
  [CalendarDays, "02", "Plan", "We shape the concept, strategy, and creative direction."],
  [Film, "03", "Produce", "We create with intention and attention to every detail."],
  [CheckSquare, "04", "Deliver", "We deliver polished content that is ready to make an impact."],
  [Rocket, "05", "Grow", "We review the results and refine for long-term growth."],
] as const;

const workExperience = [
  {
    period: "Oct 2024 - Present",
    role: "Creative Department (Full-time)",
    company: "Free and Safe Indonesia",
    description: "Produced 12+ contents/month, managed Instagram (Bowlah), and documented events & program.",
  },
  {
    period: "Oct 2024 - Dec 2024",
    role: "Videographer & Video Editor (Freelance)",
    company: "Blessings Cafe",
    description: "Produced and edited 3 video content for YouTube and social media, focusing on storytelling and audience engagement.",
  },
  {
    period: "Aug 2024 - Oct 2024",
    role: "Social Media Marketing Specialist",
    company: "Jefs.marketing",
    description: "Managed 4 client accounts, producing 12+ feeds/reels and 16+ stories/month with end-to-end content execution.",
  },
  {
    period: "Mar 2024 - Jun 2024",
    role: "Social Media Marketing Intern",
    company: "Comvee Adaptive Clothing",
    description: "Produced 40+ social media contents and supported brand communication through visual content & photoshoots for the brand catalog.",
  },
  {
    period: "Jul 2023 - Aug 2023",
    role: "Social Media Marketing Intern",
    company: "CV Samara Micron Saleronell",
    description: "Developed content planning and design, and executed social media content including posting and audience insights.",
  },
  {
    period: "Sep 2022 - Nov 2022",
    role: "Social Media Marketing Specialist (Freelance)",
    company: "Ropang Citepus",
    description: "Created 10+ TikTok videos to increase brand visibility and engagement through short-form content.",
  },
  {
    period: "Dec 2020 - May 2022",
    role: "Photographer & Videographer",
    company: "Dreampict.shoots",
    description: "Delivered 25+ client projects, producing 65+ photos and 2+ video contents while managing social media to attract clients.",
  },
];

const bentoSpans = [
  "sm:col-span-1 sm:row-span-3 md:col-span-1 md:row-span-3",
  "sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2",
  "sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-3",
  "sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2",
  "sm:col-span-1 sm:row-span-3 md:col-span-1 md:row-span-3",
  "sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2",
  "sm:col-span-1 sm:row-span-2 md:col-span-1 md:row-span-3",
  "sm:col-span-2 sm:row-span-2 md:col-span-2 md:row-span-2",
] as const;

function toBentoGalleryItems(items: Media[]): BentoGalleryItem[] {
  return items.slice(0, 8).map((item, index) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    desc: item.description || "Purposeful visual story for modern brands.",
    url: item.url,
    thumbnailUrl: item.thumbnailUrl || item.galleryUrls?.[0] || (item.type === "video" ? asset("about-portrait.png") : item.url),
    span: bentoSpans[index % bentoSpans.length],
    category: item.category,
  }));
}

function PortfolioCard({ media, onOpen, featured = false }: { media: Media; onOpen: () => void; featured?: boolean }) {
  const image = media.thumbnailUrl || media.url;
  return (
    <button
      onClick={onOpen}
      className={`group relative block w-full overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#101313] text-left transition duration-500 hover:-translate-y-0.5 hover:border-white/24 ${featured ? "aspect-[4/4.35]" : "aspect-[4/2.95]"}`}
    >
      <img src={image} alt={media.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/84 via-black/8 to-transparent" />
      <div className="absolute inset-0 opacity-0 ring-1 ring-inset ring-white/14 transition duration-500 group-hover:opacity-100" />
      {media.type === "video" && (
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-black/22 text-white backdrop-blur-sm transition group-hover:scale-105">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </span>
      )}
      <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/24 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/64 backdrop-blur-md">
        {media.category || media.type}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.04em] text-white">{media.title}</h3>
          <p className="mt-1 line-clamp-1 max-w-[18rem] text-xs text-white/62">{media.description || "Purposeful visual story for modern brands."}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 backdrop-blur-md">
          {media.type === "video" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
        </span>
      </div>
    </button>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="section-label">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl font-display text-4xl font-light leading-tight text-white md:text-6xl">{title}</h2>
      </div>
      {text && <p className="max-w-md text-sm leading-7 text-white/52">{text}</p>}
    </div>
  );
}

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<Media[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const mediaQuery = useListMedia();
  const liveMedia = Array.isArray(mediaQuery.data) ? mediaQuery.data : [];
  const media = liveMedia;
  const { data: settings = defaultSiteSettings } = useSiteSettings();
  const { data: portfolioCategories = [] } = usePortfolioCategories();

  useEffect(() => { applySeo(settings); }, [settings]);

  const filters = ["All", ...portfolioCategories.map((category) => category.name)];
  const filtered = useMemo(() => {
    if (filter === "All") return media;
    const term = filter.toLowerCase();
    return media.filter((item) => item.category?.toLowerCase() === term);
  }, [filter, media]);
  const selectedMedia = useMemo(() => media.filter((item) => item.featured).slice(0, 4), [media]);
  const categoryCount = Math.max(portfolioCategories.length, 4);
  const filteredBentoItems = useMemo(() => toBentoGalleryItems(filtered), [filtered]);

  const openMedia = (items: Media[], index: number) => {
    setModalItems(items);
    setModalIndex(index);
    setModalOpen(true);
  };

  const openBentoMedia = (item: BentoGalleryItem) => {
    const index = filtered.findIndex((mediaItem) => mediaItem.id === item.id);
    openMedia(filtered, Math.max(index, 0));
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#080a0a] text-[#e9ece8]">
      <Navbar />

      <main>
        <section id="top" className="relative min-h-[760px] overflow-hidden md:min-h-[860px]">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a0a_0%,#0b0f0f_58%,#0d1010_100%)]" />
          <EtheralShadow
            className="absolute inset-0 opacity-70"
            color="rgba(212, 164, 84, 0.78)"
            animation={{ scale: 96, speed: 72 }}
            noise={{ opacity: 0.3, scale: 1 }}
            sizing="fill"
            showTitle={false}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_30%,rgba(117,183,187,0.22),transparent_32%),radial-gradient(circle_at_30%_62%,rgba(212,164,84,0.2),transparent_38%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080a0a]/85 via-[#080a0a]/48 to-[#080a0a]/78" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <div className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-16 px-6 pb-16 pt-28 md:min-h-[860px] md:px-12 lg:grid-cols-[1.06fr_0.94fr] lg:px-20">
            <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-[760px]">
              <div className="mb-7 inline-flex items-center gap-3 border-b border-white/18 pb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/52">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d4a454]" />
                Bandung based visual storyteller
              </div>
              <h1 className="font-display text-6xl font-light leading-[0.94] text-white sm:text-7xl lg:text-[104px]">
                {settings.heroTitle}
                <span className="block text-white/34">Visual Storytelling</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/72 md:text-xl">{settings.heroSubtitle}</p>
              <div className="mt-10 flex flex-wrap gap-4">
                <a href="#work" className="group inline-flex h-13 items-center gap-5 rounded-full bg-white px-7 text-sm font-medium text-[#0b0f0f] transition hover:bg-[#d4a454]">View Work <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></a>
                <a href="#contact" className="group inline-flex h-13 items-center gap-5 rounded-full border border-white/18 px-7 text-sm font-medium text-white/76 transition hover:border-white/34 hover:text-white">Start a Project <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></a>
              </div>
              <div className="mt-14 grid max-w-2xl grid-cols-3 gap-px border border-white/10 bg-white/10">
                {[
                  ["5+", "Years creating"],
                  [`${media.length || 60}+`, "Published assets"],
                  [`${categoryCount}`, "Creative lanes"],
                ].map(([value, label]) => (
                  <div key={label} className="bg-[#080a0a] p-4">
                    <strong className="font-display text-2xl font-light text-white/92 md:text-3xl">{value}</strong>
                    <span className="mt-1 block text-[11px] uppercase tracking-[0.13em] text-white/42">{label}</span>
                  </div>
                ))}
              </div>
              <a href="#selected" className="mt-12 inline-flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.18em] text-white/46">
                <span className="h-9 w-px bg-white/18" /> Scroll to explore
              </a>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15 }} className="relative hidden min-h-[620px] lg:block">
              <div className="absolute right-0 top-8 h-[520px] w-[390px] rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-2">
                <img src={selectedMedia[0]?.thumbnailUrl || asset("about-portrait.png")} alt="" className="h-full w-full rounded-[1.15rem] object-cover grayscale-[12%]" />
              </div>
              <div className="absolute bottom-14 left-0 h-[300px] w-[260px] rounded-[1.25rem] border border-white/10 bg-[#0d1212] p-2">
                <img src={selectedMedia[1]?.thumbnailUrl || asset("about-portrait.png")} alt="" className="h-full w-full rounded-[0.9rem] object-cover grayscale-[18%]" />
              </div>
              <div className="absolute bottom-0 right-12 max-w-xs border-l border-white/16 bg-[#080a0a]/80 p-5 backdrop-blur-xl">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/44">Current focus</p>
                <p className="mt-3 text-sm leading-6 text-white/68">Cinematic content systems for brands, events, and social campaigns.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] space-y-24 px-6 pb-8 md:px-12 lg:px-20">
          <CompaniesSlider />

          <section id="selected" className="scroll-mt-24 pt-2">
            <SectionIntro eyebrow="Selected Work" title="A sharper first look at recent visual stories." text="Featured work gets the cinematic treatment first: stronger cover images, faster scanning, and clearer creative context." />
            {mediaQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[4/4.1] animate-pulse rounded-[1.75rem] bg-white/5" />)}
              </div>
            ) : mediaQuery.isError ? (
              <div className="border border-red-400/20 bg-red-400/5 px-6 py-14 text-center">
                <p className="text-sm text-red-200/70">Featured work could not be loaded. Please try again shortly.</p>
              </div>
            ) : selectedMedia.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {selectedMedia.map((item, index) => <PortfolioCard key={item.id} media={item} featured onOpen={() => openMedia(selectedMedia, index)} />)}
              </div>
            ) : (
              <div className="border border-white/10 bg-[#0d1212] px-6 py-14 text-center">
                <p className="text-sm text-white/45">No featured work has been published yet.</p>
              </div>
            )}
          </section>

          <section id="services" className="scroll-mt-24">
            <SectionIntro eyebrow="Services" title="One creative partner from concept to final delivery." text="Clear lanes make it easier for clients to understand what to book, what they get, and where each deliverable lives." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {services.map(([Icon, title, text]) => (
                <article key={title} className="group rounded-[1.25rem] border border-white/10 bg-white/[0.02] p-6 transition duration-500 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/[0.035]">
                  <div className="flex items-start gap-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 text-white/68 transition group-hover:text-white">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </span>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
                      <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
                      <a href="#contact" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d4a454]">Learn more <ArrowRight className="h-3.5 w-3.5" /></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="work" className="scroll-mt-24">
            <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-label mb-4">Portfolio</p>
                <h2 className="mb-6 max-w-2xl font-display text-4xl font-light leading-tight text-white md:text-6xl">Explore by creative discipline.</h2>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-4 py-2 text-xs transition ${filter === item ? "border-white bg-white text-[#101212]" : "border-white/10 bg-transparent text-white/54 hover:border-white/24 hover:text-white"}`}>{item}</button>
                  ))}
                </div>
              </div>
            </div>
            {mediaQuery.isLoading ? (
              <div className="grid auto-rows-[72px] gap-3 sm:grid-cols-3 md:grid-cols-4 md:auto-rows-[84px] lg:auto-rows-[92px]">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className={`animate-pulse rounded-[1.1rem] bg-white/5 ${bentoSpans[index % bentoSpans.length]}`} />
                ))}
              </div>
            ) : mediaQuery.isError ? (
              <div className="border border-red-400/20 bg-red-400/5 px-6 py-14 text-center">
                <p className="text-sm text-red-200/70">Portfolio content could not be loaded. Please try again shortly.</p>
              </div>
            ) : filteredBentoItems.length > 0 ? (
              <InteractiveBentoGallery
                mediaItems={filteredBentoItems}
                title={filter === "All" ? "A living wall of recent work." : `${filter} stories in motion.`}
                description="Scan, tap, and explore the work. The gallery keeps the portfolio tactile without losing the clean editorial feel."
                onItemOpen={openBentoMedia}
              />
            ) : (
              <div className="border border-white/10 bg-[#0d1212] px-6 py-14 text-center">
                <p className="text-sm text-white/45">No published work is available for this category.</p>
              </div>
            )}
          </section>

          <section id="about" className="scroll-mt-24">
            <div className="grid gap-10 border-y border-white/10 py-10 lg:grid-cols-[0.74fr_1.26fr] lg:items-center">
              <div className="relative">
                <img src={asset("about-portrait.png")} alt="Richard Juan" className="aspect-[4/5] w-full rounded-[1.15rem] object-cover grayscale-[10%]" />
                <div className="absolute -bottom-5 left-5 border border-white/12 bg-[#080a0a]/88 px-5 py-4 backdrop-blur-xl">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#75b7bb]">Available in</p>
                  <p className="mt-1 text-sm font-semibold text-white">{settings.location}</p>
                </div>
              </div>
              <div className="p-2 md:p-6">
                <p className="section-label mb-6">About Me</p>
                <h2 className="font-display text-4xl font-light leading-tight text-white md:text-6xl">{settings.aboutTitle}</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/62">{settings.aboutBody}</p>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/52">With 5+ years of experience, I combine creativity with strategy to deliver content that looks good and works hard.</p>
              </div>
            </div>
            <div className="mt-14">
              <h3 className="font-display text-3xl font-light text-white md:text-4xl">Work Experience</h3>
              <div className="mt-8 border-l border-[#75b7bb]/55 pl-7 md:pl-9">
                {workExperience.map((experience, index) => (
                  <article key={`${experience.period}-${experience.company}`} className="relative grid gap-3 border-b border-white/8 py-7 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[180px_1fr] md:gap-8">
                    <span className={`absolute -left-[32px] h-2.5 w-2.5 rounded-full border-2 border-[#0b0f0f] bg-[#75b7bb] md:-left-[40px] ${index === 0 ? "top-1" : "top-8"}`} />
                    <p className="text-sm font-medium text-[#75b7bb]">{experience.period}</p>
                    <div>
                      <h4 className="text-base font-semibold text-white">{experience.role}</h4>
                      <p className="mt-1 text-sm text-[#d4a454]">{experience.company}</p>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52">{experience.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="process" className="scroll-mt-24">
            <SectionIntro eyebrow="Process" title="A calm production flow for cleaner results." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {process.map(([Icon, number, title, text]) => (
                <article key={number} className="relative rounded-[1rem] border border-white/10 bg-white/[0.018] p-5">
                  <div className="flex items-center gap-3 text-[#75b7bb]"><Icon className="h-7 w-7" strokeWidth={1.4} /><span className="text-[10px] text-white/38">{number}</span></div>
                  <h3 className="mt-4 text-sm font-semibold uppercase text-white">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-white/50">{text}</p>
                  <ArrowRight className="absolute right-5 top-6 h-4 w-4 text-white/24" />
                </article>
              ))}
            </div>
          </section>

          <section id="contact" className="scroll-mt-24 border-y border-white/10 py-16 md:py-24">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <p className="section-label">Let's Work Together</p>
                <h2 className="mt-5 font-display text-5xl font-light leading-tight text-white md:text-7xl">Have a project in mind?</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/52">Tell me what you are building. We can discuss the right visual direction, scope, and production plan directly.</p>
                <div className="mt-7 flex items-center gap-3 text-sm text-white/55"><MapPin className="h-5 w-5 text-[#75b7bb]" />{settings.location}</div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a href={`https://wa.me/${settings.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-14 min-w-52 items-center justify-between gap-8 rounded-full bg-white px-6 text-sm font-medium text-[#101212] transition hover:bg-[#d4a454]"><span className="inline-flex items-center gap-3"><MessageCircle className="h-5 w-5" />WhatsApp</span><ArrowRight className="h-4 w-4" /></a>
                <a href={`mailto:${settings.email}`} className="inline-flex h-14 min-w-52 items-center justify-between gap-8 rounded-full border border-white/18 px-6 text-sm font-medium text-white/76 transition hover:border-white/32 hover:text-white"><span className="inline-flex items-center gap-3"><Mail className="h-5 w-5" />Email</span><ArrowRight className="h-4 w-4" /></a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <MediaDetailModal items={modalItems} initialIndex={modalIndex} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
