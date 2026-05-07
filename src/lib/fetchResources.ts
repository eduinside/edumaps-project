type FetchOptions = {
  forceRefresh?: boolean;
};

export async function fetchResources(options: FetchOptions = {}): Promise<any[]> {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
  let resources: any[] = [];

  try {
    if (gasUrl) {
      const res = await fetch(gasUrl, options.forceRefresh
        ? { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
        : { next: { revalidate: 3600 }, headers: { "Cache-Control": "no-cache" } }
      );
      if (res.ok) {
        resources = await res.json();
      }
    }

    if (!resources || resources.length === 0) {
      try {
        const localResources = await import("../data/resources.json");
        resources = localResources.default;
      } catch {
        console.warn("No local fallback data found, using empty list.");
        resources = [];
      }
    }
  } catch (error) {
    console.error("Data fetch process failed:", error);
    resources = [];
  }

  return resources;
}
