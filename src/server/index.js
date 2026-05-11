import express from "express";
import cors from "cors";
import prisma from "./prisma.js";
import { getGamReportRows } from "./gam/getGamReport.js";
import cron from "node-cron";

const app = express();

let lastGamSync = null;
let gamSyncRunning = false;
let gamSyncError = false;

app.use(cors({
  origin: [
    "https://springow.up.railway.app",
  ],
  credentials: true
}));

app.use(express.json());

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function optimizeTrafficProbabilities() {
  const links = await prisma.link.findMany({
    where: { disabled: false },
  });

  const groups = {};

  for (const link of links) {
    const key = `${link.splitterId}-${link.tab}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(link);
  }

  for (const key in groups) {
    const group = groups[key];

    const totalEcpm = group.reduce((sum, link) => {
      return sum + Number(link.ecpm || 0);
    }, 0);

    for (const link of group) {
      const probability =
        totalEcpm > 0
          ? (Number(link.ecpm || 0) / totalEcpm) * 100
          : 100 / group.length;

      await prisma.link.update({
        where: { id: link.id },
        data: {
          probability: Number(probability.toFixed(2)),
        },
      });
    }
  }

  console.log("✅ Probabilidades otimizadas automaticamente");
}

async function syncGamAutomatically() {
  try {
    gamSyncRunning = true;
    gamSyncError = false;

    console.log("⏳ Atualizando dados do GAM...");

    const reportRows = await getGamReportRows();
    const links = await prisma.link.findMany();

    for (const link of links) {
      const campaign = link.utms?.utm_campaign;

      const found = reportRows.find((row) => {
        return (
          normalize(row.key) === "utm_campaign" &&
          normalize(row.value) === normalize(campaign)
        );
      });

      await prisma.link.update({
        where: { id: link.id },
        data: {
          ecpm: found?.ecpm || 0,
          impressions: found?.impressions || 0,
          revenue: found?.revenue || 0,
        },
      });
    }

    await optimizeTrafficProbabilities();

    lastGamSync = new Date();
    gamSyncRunning = false;

    console.log("✅ GAM atualizado automaticamente");
  } catch (error) {
    gamSyncError = true;
    gamSyncRunning = false;

    console.error("❌ Erro ao atualizar GAM automaticamente:", error);
  }
}
/* =========================
   PROJECTS
========================= */

app.get("/api/projects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    res.status(500).json({ error: "Erro ao buscar projetos" });
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Nome do projeto é obrigatório" });
    }

    const project = await prisma.project.create({
      data: { name: name.trim() },
    });

    res.json(project);
  } catch (error) {
    console.error("Erro ao criar projeto:", error);
    res.status(500).json({ error: "Erro ao criar projeto" });
  }
});

app.delete("/api/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.project.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    res.status(500).json({ error: "Erro ao deletar projeto" });
  }
});

app.post("/api/login", (req, res) => {
  const { user, password } = req.body;

  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gustavogay";

  if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

/* =========================
   AD MANAGER REPORT
========================= */

app.post("/api/admanager/ecpm", async (req, res) => {
  try {
    const { links = [] } = req.body;
    const reportRows = await getGamReportRows();

    const data = links.map((link) => {
      const linkUtms = link.utms || {};
      const campaign = linkUtms.utm_campaign;

      const found = reportRows.find((row) => {
        return (
          normalize(row.key) === "utm_campaign" &&
          normalize(row.value) === normalize(campaign)
        );
      });

      return {
        id: link.id,
        url: link.url,
        ecpm: found?.ecpm || 0,
        impressions: found?.impressions || 0,
        revenue: found?.revenue || 0,
        matchedKey: found?.key || null,
        matchedValue: found?.value || null,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Erro na API:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao processar relatório.",
    });
  }
});

/* =========================
   SPLITTERS
========================= */

app.get("/api/projects/:projectId/splitters", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const splitters = await prisma.splitter.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    res.json(splitters);
  } catch (error) {
    console.error("Erro ao buscar splitters:", error);
    res.status(500).json({ error: "Erro ao buscar splitters" });
  }
});

app.post("/api/projects/:projectId/splitters", async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { category, location } = req.body;

    const splitter = await prisma.splitter.create({
      data: {
        category,
        location,
        projectId,
      },
    });

    res.json(splitter);
  } catch (error) {
    console.error("Erro ao criar splitter:", error);
    res.status(500).json({ error: "Erro ao criar splitter" });
  }
});

app.delete("/api/splitters/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    await prisma.splitter.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar splitter:", error);
    res.status(500).json({ error: "Erro ao deletar splitter" });
  }
});

/* =========================
   SPLITTER TABS
========================= */

app.get("/api/splitters/:splitterId/tabs", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);

    const tabs = await prisma.splitterTab.findMany({
      where: { splitterId },
      orderBy: { createdAt: "asc" },
    });

    res.json(tabs);
  } catch (error) {
    console.error("Erro ao buscar splits:", error);
    res.status(500).json({ error: "Erro ao buscar splits" });
  }
});

app.post("/api/splitters/:splitterId/tabs", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const { tab } = req.body;

    const cleanTab = String(tab || "").trim();

    if (!cleanTab) {
      return res.status(400).json({ error: "Tab é obrigatória" });
    }

    const created = await prisma.splitterTab.upsert({
      where: {
        splitterId_tab: {
          splitterId,
          tab: cleanTab,
        },
      },
      update: {},
      create: {
        splitterId,
        tab: cleanTab,
      },
    });

    res.json(created);
  } catch (error) {
    console.error("Erro ao criar split:", error);
    res.status(500).json({ error: "Erro ao criar split" });
  }
});

app.put("/api/splitters/:splitterId/tabs/:oldTab", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const oldTab = String(req.params.oldTab || "").trim();
    const { newTab } = req.body;

    const cleanNewTab = String(newTab || "").trim();

    if (!oldTab || !cleanNewTab) {
      return res.status(400).json({
        error: "Tabs inválidas",
      });
    }

    // Atualiza tabela de tabs
    await prisma.splitterTab.updateMany({
      where: {
        splitterId,
        tab: oldTab,
      },
      data: {
        tab: cleanNewTab,
      },
    });

    // Atualiza links
    await prisma.link.updateMany({
      where: {
        splitterId,
        tab: oldTab,
      },
      data: {
        tab: cleanNewTab,
      },
    });

    // Atualiza rotas
    await prisma.splitterRoute.updateMany({
      where: {
        splitterId,
        tab: oldTab,
      },
      data: {
        tab: cleanNewTab,
      },
    });

    res.json({
      success: true,
      oldTab,
      newTab: cleanNewTab,
    });
  } catch (error) {
    console.error("Erro ao renomear split:", error);

    res.status(500).json({
      error: "Erro ao renomear split",
    });
  }
});

app.delete("/api/splitters/:splitterId/tabs/:tab", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const tab = String(req.params.tab || "").trim();

    if (!tab) {
      return res.status(400).json({ error: "Tab inválida" });
    }

    await prisma.link.deleteMany({
      where: {
        splitterId,
        tab,
      },
    });

    await prisma.splitterRoute.deleteMany({
      where: {
        splitterId,
        tab,
      },
    });

    await prisma.splitterTab.deleteMany({
      where: {
        splitterId,
        tab,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar split:", error);
    res.status(500).json({ error: "Erro ao deletar split" });
  }
});

/* =========================
   LINKS
========================= */

app.get("/api/splitters/:splitterId/links", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const tab = req.query.tab ? String(req.query.tab) : null;

    const links = await prisma.link.findMany({
      where: {
        splitterId,
        ...(tab && { tab }),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(links);
  } catch (error) {
    console.error("Erro ao buscar links:", error);
    res.status(500).json({ error: "Erro ao buscar links" });
  }
});

app.post("/api/splitters/:splitterId/links", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const { url, type, utms, tab } = req.body;

    const linkTab = String(tab || "1");

    await prisma.splitterTab.upsert({
      where: {
        splitterId_tab: {
          splitterId,
          tab: linkTab,
        },
      },
      update: {},
      create: {
        splitterId,
        tab: linkTab,
      },
    });

    const existingLink = await prisma.link.findFirst({
      where: {
        splitterId,
        tab: linkTab,
        url,
      },
    });

    if (existingLink) {
      return res.json(existingLink);
    }

    const link = await prisma.link.create({
      data: {
        url,
        type: type || "Landing Page",
        utms: utms || {},
        tab: linkTab,
        splitterId,
      },
    });

    res.json(link);
  } catch (error) {
    console.error("Erro ao criar link:", error);
    res.status(500).json({ error: "Erro ao criar link" });
  }
});

app.put("/api/links/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;

    const data = {};

    if (body.url !== undefined) data.url = body.url;
    if (body.type !== undefined) data.type = body.type;
    if (body.utms !== undefined) data.utms = body.utms;
    if (body.disabled !== undefined) data.disabled = Boolean(body.disabled);
    if (body.ecpm !== undefined) data.ecpm = Number(body.ecpm || 0);

    if (body.impressions !== undefined) {
      data.impressions = Number(body.impressions || 0);
    }

    if (body.revenue !== undefined) data.revenue = Number(body.revenue || 0);

    const updated = await prisma.link.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar link:", error);
    res.status(500).json({ error: "Erro ao atualizar link" });
  }
});

app.delete("/api/links/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const existingLink = await prisma.link.findUnique({
      where: { id },
    });

    if (!existingLink) {
      return res.json({ success: true, deleted: false });
    }

    await prisma.link.delete({
      where: { id },
    });

    res.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Erro ao deletar link:", error);
    res.status(500).json({ error: "Erro ao deletar link" });
  }
});

/* =========================
   ROUTES
========================= */

app.get("/api/splitters/:splitterId/routes", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const tab = req.query.tab ? String(req.query.tab) : null;

    const routes = await prisma.splitterRoute.findMany({
      where: {
        splitterId,
        ...(tab && { tab }),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(routes);
  } catch (error) {
    console.error("Erro ao buscar rotas:", error);
    res.status(500).json({ error: "Erro ao buscar rotas" });
  }
});

app.post("/api/splitters/:splitterId/routes", async (req, res) => {
  try {
    const splitterId = Number(req.params.splitterId);
    const { domain, slug, tab, pixelId, loaderTitle, loaderSubtitle } = req.body;

    if (!domain || !slug) {
      return res.status(400).json({ error: "Domínio e slug são obrigatórios" });
    }

    const routeTab = String(tab || "1");

    await prisma.splitterTab.upsert({
      where: {
        splitterId_tab: {
          splitterId,
          tab: routeTab,
        },
      },
      update: {},
      create: {
        splitterId,
        tab: routeTab,
      },
    });

    const cleanDomain = String(domain).trim().replace(/\/+$/, "");
    const cleanSlug = String(slug)
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    const route = await prisma.splitterRoute.create({
      data: {
        domain: cleanDomain,
        slug: cleanSlug,
        pixelId: pixelId || null,
        loaderTitle: loaderTitle || null,
        loaderSubtitle: loaderSubtitle || null,
        splitterId,
        tab: routeTab,
      },
    });

    res.json(route);
  } catch (error) {
    console.error("Erro ao criar rota:", error);
    res.status(500).json({ error: "Erro ao criar rota" });
  }
});

app.put("/api/routes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
  domain,
  slug,
  tab,
  pixelId,
  loaderTitle,
  loaderSubtitle,
} = req.body;

    const existingRoute = await prisma.splitterRoute.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return res.status(404).json({ error: "Rota não encontrada" });
    }

    if (tab !== undefined) {
      const cleanTab = String(tab || "1");

      await prisma.splitterTab.upsert({
        where: {
          splitterId_tab: {
            splitterId: existingRoute.splitterId,
            tab: cleanTab,
          },
        },
        update: {},
        create: {
          splitterId: existingRoute.splitterId,
          tab: cleanTab,
        },
      });
    }

    const updated = await prisma.splitterRoute.update({
      where: { id },
      data: {
        ...(domain !== undefined && {
          domain: String(domain).trim().replace(/\/+$/, ""),
        }),
        ...(slug !== undefined && {
          slug: String(slug).trim().replace(/^\/+/, "").replace(/\/+$/, ""),
        }),
        ...(tab !== undefined && {
          tab: String(tab || "1"),
        }),
        ...(pixelId !== undefined && {
  pixelId: pixelId || null,
}),

...(loaderTitle !== undefined && {
  loaderTitle: loaderTitle || null,
}),

...(loaderSubtitle !== undefined && {
  loaderSubtitle: loaderSubtitle || null,
}),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar rota:", error);
    res.status(500).json({ error: "Erro ao atualizar rota" });
  }
});

app.delete("/api/routes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.splitterRoute.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar rota:", error);
    res.status(500).json({ error: "Erro ao deletar rota" });
  }
});

/* =========================
   GAM CONNECTIONS
========================= */

app.get("/api/gam/connections", async (req, res) => {
  try {
    const connections = await prisma.gamConnection.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(connections);
  } catch (error) {
    console.error("Erro ao buscar conexões GAM:", error);

    res.status(500).json({
      error: "Erro ao buscar conexões GAM",
    });
  }
});

app.post("/api/gam/connections", async (req, res) => {
  try {

const { name, networkCode, reportType } = req.body;

    if (!name || !networkCode) {
      return res.status(400).json({
        error: "Nome e Network Code são obrigatórios",
      });
    }

    const created = await prisma.gamConnection.create({
      data: {
  name: String(name).trim(),
  networkCode: String(networkCode).trim(),
  reportType: reportType || "utm_campaign",
},
    });

    res.json(created);
  } catch (error) {
    console.error("Erro ao criar conexão GAM:", error);

    res.status(500).json({
      error: "Erro ao criar conexão GAM",
    });
  }
});

app.post("/api/gam/sync/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const gam = await prisma.gamConnection.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!gam) {
      return res.status(404).json({
        error: "GAM não encontrado",
      });
    }

    console.log("Sincronizando GAM:");
    console.log(gam);

    await prisma.gamConnection.update({
      where: {
        id: gam.id,
      },

      data: {
        lastSyncAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "Sync realizado",
      gam,
    });
  } catch (error) {
    console.error(
      "Erro ao sincronizar GAM:",
      error
    );

    return res.status(500).json({
      error: "Erro ao sincronizar GAM",
    });
  }
});

app.put("/api/gam/connections/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { name, networkCode, reportType } = req.body;

const updated = await prisma.gamConnection.update({
  where: { id },
  data: {
    ...(name !== undefined && {
      name: String(name).trim(),
    }),
    ...(networkCode !== undefined && {
      networkCode: String(networkCode).trim(),
    }),
    ...(reportType !== undefined && {
      reportType: String(reportType).trim(),
    }),
  },
});

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar conexão GAM:", error);

    res.status(500).json({
      error: "Erro ao atualizar conexão GAM",
    });
  }
});

app.delete("/api/gam/connections/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.gamConnection.delete({
      where: { id },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar conexão GAM:", error);

    res.status(500).json({
      error: "Erro ao deletar conexão GAM",
    });
  }
});

/* =========================
   DEBUG
========================= */

app.get("/debug/routes", async (req, res) => {
  try {
    const routes = await prisma.splitterRoute.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(routes);
  } catch (error) {
    console.error("Erro no debug routes:", error);
    res.status(500).json({ error: "Erro ao buscar rotas debug" });
  }
});

/* =========================
   REDIRECT
========================= */

function buildUrlWithUtms(baseUrl, utms = {}) {
  try {
    const url = new URL(baseUrl);

    const parsedUtms =
      typeof utms === "string" ? JSON.parse(utms || "{}") : utms || {};

    for (const [key, value] of Object.entries(parsedUtms)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  } catch (error) {
    console.error("Erro ao montar URL com UTMs:", error);
    return baseUrl;
  }
}

function pickByProbability(links) {
  const totalProbability = links.reduce((sum, link) => {
    return sum + Number(link.probability || 0);
  }, 0);

  if (totalProbability <= 0) {
    return links[Math.floor(Math.random() * links.length)];
  }

  const random = Math.random() * totalProbability;
  let accumulated = 0;

  for (const link of links) {
    accumulated += Number(link.probability || 0);

    if (random <= accumulated) {
      return link;
    }
  }

  return links[links.length - 1];
}

function renderRedirectLoader({
  url,
  pixelId,
  customHtml,
  loaderTitle,
  loaderSubtitle,
}) {  
  const finalUrlJson = JSON.stringify(url);

  if (customHtml && typeof customHtml === "string") {
    return customHtml
      .replaceAll("{{URL}}", url)
      .replaceAll("{{URL_JSON}}", finalUrlJson);
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecionando...</title>

  ${
    pixelId
      ? `
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  </script>
  `
      : ""
  }

  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: white;
      font-family: Arial, sans-serif;
    }

    .box {
      text-align: center;
      padding: 24px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 5px solid rgba(255,255,255,0.25);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 18px;
    }

    h1 {
      font-size: 24px;
      margin: 0 0 8px;
    }

    p {
      margin: 0;
      opacity: 0.85;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>

<body>
  <div class="box">
    <div class="spinner"></div>
    <h1>${loaderTitle || "Título"}</h1>
<p>${loaderSubtitle || "Subtítulo"}</p>
  </div>

  <script>
    setTimeout(function () {
      if (typeof fbq === "function") {
        fbq('track', 'Lead');
      }

      window.location.href = ${finalUrlJson};
    }, 1200);
  </script>
</body>
</html>
`;
}

app.get("/api/gam/status", (req, res) => {
  res.json({
    lastSync: lastGamSync,
    running: gamSyncRunning,
    error: gamSyncError,
  });
});

app.get("/go/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    const host = String(req.hostname || "").trim();
    const hostHeader = String(req.get("host") || "").trim();

    console.log("DEBUG /go/:slug", {
      slug,
      hostname: host,
      hostHeader,
    });

    let route = await prisma.splitterRoute.findFirst({
      where: {
        slug,
        OR: [
          { domain: host },
          { domain: hostHeader },
          { domain: `http://${host}` },
          { domain: `https://${host}` },
          { domain: `http://${hostHeader}` },
          { domain: `https://${hostHeader}` },
        ],
      },
      include: {
        splitter: true,
      },
    });

    if (!route) {
      console.log("⚠️ Rota não encontrada por domínio. Tentando fallback só por slug...");

      route = await prisma.splitterRoute.findFirst({
        where: { slug },
        include: {
          splitter: true,
        },
      });
    }

    if (!route) {
      console.log("❌ Rota não encontrada:", {
        slug,
        hostname: host,
        hostHeader,
      });

      return res.status(404).send("Rota não encontrada");
    }

    console.log("✅ Rota encontrada:", {
      id: route.id,
      domain: route.domain,
      slug: route.slug,
      splitterId: route.splitterId,
      tab: route.tab,
    });

    const links = await prisma.link.findMany({
      where: {
        splitterId: route.splitterId,
        tab: String(route.tab || "1"),
        disabled: false,
      },
    });

    if (!links.length) {
      return res.status(404).send("Nenhum link ativo encontrado para essa rota");
    }

    let selectedLink = pickByProbability(links);

    if (!selectedLink) {
      selectedLink = links[0];
    }

    if (!selectedLink?.url || !String(selectedLink.url).startsWith("http")) {
      return res.status(500).send("URL inválida no link selecionado");
    }

    await prisma.link.update({
      where: { id: selectedLink.id },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });

    const finalUrl = buildUrlWithUtms(selectedLink.url, selectedLink.utms);

    console.log("UTMs aplicadas:", {
      original: selectedLink.url,
      utms: selectedLink.utms,
      final: finalUrl,
    });

    console.log("🚀 Redirect:", {
      slug,
      domain: route.domain,
      splitterId: route.splitterId,
      tab: route.tab,
      selectedLinkId: selectedLink.id,
      finalUrl,
    });

    return res.send(
      renderRedirectLoader({
  url: finalUrl,
  pixelId: route.pixelId || process.env.FB_PIXEL_ID || "1006617537466411",
  customHtml: route.splitter?.loaderHtml,
  loaderTitle: route.loaderTitle,
  loaderSubtitle: route.loaderSubtitle,
})
    );
  } catch (error) {
    console.error("Erro em /go/:slug:", error);
    return res.status(500).send("Erro interno no redirecionamento");
  }
});

syncGamAutomatically();

cron.schedule("0 * * * *", syncGamAutomatically);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});