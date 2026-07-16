import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://showcase.api-security-lab-platform.workers.dev/",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
