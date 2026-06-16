import { useQuery } from "@tanstack/react-query";

export interface SiteSettings {
  siteName: string; heroTitle: string; heroSubtitle: string; aboutTitle: string; aboutBody: string;
  email: string; phone: string; location: string; instagramUrl: string;
  linkedinUrl: string; seoTitle: string; seoDescription: string;
  seoKeywords: string; canonicalUrl: string; ogImageUrl: string;
}

export const defaultSiteSettings: SiteSettings = {
  siteName: "Richard Juan", heroTitle: "Richard Juan", heroSubtitle: "Videographer, photographer, and content strategist in Bandung.",
  aboutTitle: "I'm Richard Juan.", aboutBody: "A visual storyteller based in Bandung. I help brands and individuals communicate their message through purposeful visuals and strategic content.",
  email: "richardjuanw@gmail.com", phone: "+62 851 5810 0651", location: "Bandung, West Java, Indonesia",
  instagramUrl: "https://instagram.com/rchardjuan_", linkedinUrl: "",
  seoTitle: "Richard Juan - Videographer & Photographer in Bandung", seoDescription: "Richard Juan is a Bandung-based videographer, photographer, and content strategist creating cinematic work for brands, events, and individuals.",
  seoKeywords: "Bandung videographer, Bandung photographer, video production, commercial photography, social media content",
  canonicalUrl: "https://richardjuan.com/", ogImageUrl: "https://richardjuan.com/opengraph.jpg",
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) return defaultSiteSettings;
      const data = await response.json();
      return { ...defaultSiteSettings, ...data } as SiteSettings;
    },
    staleTime: 60_000,
  });
}

export function applySeo(settings: SiteSettings) {
  document.title = settings.seoTitle;
  const setMeta = (selector: string, attribute: string, value: string) => {
    let element = document.querySelector<HTMLMetaElement>(selector);
    if (!element) { element = document.createElement("meta"); const match = selector.match(/\[([^=]+)="([^"]+)"\]/); if (match) element.setAttribute(match[1], match[2]); document.head.appendChild(element); }
    element.setAttribute(attribute, value);
  };
  setMeta('meta[name="description"]', "content", settings.seoDescription);
  setMeta('meta[name="keywords"]', "content", settings.seoKeywords);
  setMeta('meta[property="og:title"]', "content", settings.seoTitle);
  setMeta('meta[property="og:description"]', "content", settings.seoDescription);
  setMeta('meta[property="og:image"]', "content", settings.ogImageUrl);
  setMeta('meta[name="twitter:title"]', "content", settings.seoTitle);
  setMeta('meta[name="twitter:description"]', "content", settings.seoDescription);
  setMeta('meta[name="twitter:image"]', "content", settings.ogImageUrl);
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
  canonical.href = settings.canonicalUrl;
}
