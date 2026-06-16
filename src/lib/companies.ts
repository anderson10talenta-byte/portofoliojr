import { useQuery } from "@tanstack/react-query";

export interface Company {
  id: number;
  name: string;
  logoUrl: string;
  websiteUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export function useCompanies(includeInactive = false) {
  return useQuery<Company[]>({
    queryKey: ["companies", includeInactive],
    queryFn: async () => {
      const response = await fetch(`/api/companies${includeInactive ? "?all=true" : ""}`, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to load companies");
      return response.json();
    },
  });
}
