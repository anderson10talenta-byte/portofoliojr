import { useQuery } from "@tanstack/react-query";

export interface PortfolioCategory {
  id: number;
  name: string;
  type: "all" | "video" | "photo" | "design" | string;
  createdAt: string;
}

export function usePortfolioCategories() {
  return useQuery<PortfolioCategory[]>({
    queryKey: ["portfolio-categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to load portfolio categories");
      return response.json();
    },
  });
}
