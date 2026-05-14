export async function getClarityProjects() {
  const token = process.env.CLARITY_API_TOKEN;

  if (!token) {
    throw new Error("CLARITY_API_TOKEN não configurado");
  }

  const response = await fetch(
    "https://www.clarity.ms/export-data/api/v1/project-live-insights",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}