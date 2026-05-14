import { getClarityProjects } from "./getClarityProjects.js";

export async function getClarityPopularPages() {
  const data = await getClarityProjects();

  const popularPagesMetric = data.find((item) => {
    return item.metricName === "PopularPages";
  });

  const pages = popularPagesMetric?.information || [];

  return pages.map((page) => {
    let country = "";

    try {
      const parsedUrl = new URL(page.url);
      const subdomain = parsedUrl.hostname
        .split(".")[0]
        ?.toLowerCase();

      if (subdomain === "lt") country = "Lithuania";
      if (subdomain === "de") country = "Germany";
      if (subdomain === "it") country = "Italy";
      if (subdomain === "fr") country = "France";
      if (subdomain === "nl") country = "Netherlands";
      if (subdomain === "ro") country = "Romania";
      if (subdomain === "jp") country = "Japan";
      if (subdomain === "cz") country = "Czech Republic";
      if (subdomain === "en") country = "England";
    } catch {
      country = "";
    }

    return {
      url: page.url,
      visits: Number(page.visitsCount || 0),
      country: country || "Unknown",
    };
  });
}