export async function getClarityProjectList() {
  const token = process.env.CLARITY_API_TOKEN;

  if (!token) {
    throw new Error("CLARITY_API_TOKEN não configurado");
  }

  const response = await fetch(
    "https://www.clarity.ms/export-data/api/v1/projects",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Clarity projects API error ${response.status}: ${
        text || response.statusText
      }`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida da lista de projetos Clarity");
  }
}