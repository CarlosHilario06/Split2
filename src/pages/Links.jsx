import { useCallback, useEffect, useRef, useState } from "react";
import LinkModal from "../components/LinkModal";
import EditUrlModal from "../components/EditUrlModal";
import { calculateProbabilities } from "../utils/probability";

const API_URL = "https://split2.up.railway.app";

function extractUtmsFromUrl(url) {
  const queryString = (url || "").split("?")[1] || "";
  const params = new URLSearchParams(queryString);
  const utms = {};

  params.forEach((value, key) => {
    if (key.toLowerCase().startsWith("utm_")) {
      utms[key] = value;
    }
  });

  return utms;
}

function getLinkUtms(link) {
  return {
    ...extractUtmsFromUrl(link.url),
    ...(link.utms || {}),
  };
}

export default function Links({ project, splitter, onBack }) {
  const [activeTab, setActiveTab] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [allLinks, setAllLinks] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeDomain, setRouteDomain] = useState("https://split2.up.railway.app/go");
  const [routeSlug, setRouteSlug] = useState("");
  const [routePixelId, setRoutePixelId] = useState("");
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingUrl, setEditingUrl] = useState(null);
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [gamStatus, setGamStatus] = useState(null);
  const [editingTab, setEditingTab] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [routeLoaderTitle, setRouteLoaderTitle] = useState("");
  const [routeLoaderSubtitle, setRouteLoaderSubtitle] = useState("");

  const loadRequestRef = useRef(0);

  const splitTabs = tabs
    .map((tab) => String(tab.tab))
    .sort((a, b) => Number(a) - Number(b));

  const hasConfiguredSplits = splitTabs.length > 0;

  const links = activeTab
    ? allLinks.filter((link) => String(link.tab || "1") === String(activeTab))
    : [];

  const routes = activeTab
    ? allRoutes.filter((route) => String(route.tab || "1") === String(activeTab))
    : [];

  async function loadTabs() {
    if (!splitter?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/tabs`);

      if (!res.ok) throw new Error("Erro ao carregar splits");

      const data = await res.json();
      setTabs(data);
    } catch (err) {
      console.error("Erro ao carregar splits:", err);
      alert("Erro ao carregar splits");
    }
  }

  async function loadLinks() {
    if (!splitter?.id) return;

    const currentSplitterId = Number(splitter.id);
    const requestId = ++loadRequestRef.current;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${currentSplitterId}/links`);

      if (!res.ok) throw new Error("Erro ao carregar links");

      const data = await res.json();

      if (requestId !== loadRequestRef.current) return;

      const safeLinks = data
        .map((link) => ({
          ...link,
          tab: String(link.tab || "1"),
        }))
        .filter((link) => {
          const sameSplitter =
            Number(link.splitterId) === currentSplitterId ||
            Number(link.splitter?.id) === currentSplitterId;

          return sameSplitter;
        });

      setAllLinks(safeLinks);
    } catch (err) {
      console.error("Erro ao carregar links:", err);
      alert("Erro ao carregar links");
    }
  }

  async function loadRoutes() {
    if (!splitter?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/routes`);

      if (!res.ok) throw new Error("Erro ao carregar rotas");

      const data = await res.json();

      setAllRoutes(
        data.map((route) => ({
          ...route,
          tab: String(route.tab || "1"),
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar rotas:", err);
      alert("Erro ao carregar rotas");
    }
  }

  async function loadGamStatus() {
  try {
    const res = await fetch(`${API_URL}/api/gam/status`);
    const data = await res.json();

    setGamStatus(data);
  } catch (err) {
    console.error("Erro ao buscar status GAM:", err);
  }
  }

  useEffect(() => {
    setAllLinks([]);
    setAllRoutes([]);
    setTabs([]);
    setActiveTab(null);
    loadTabs();
    loadLinks();
    loadRoutes();
    loadGamStatus();
  }, [splitter?.id]);

  useEffect(() => {
    if (!activeTab && splitTabs.length > 0) {
      setActiveTab(splitTabs[0]);
    }
  }, [splitTabs, activeTab]);

  function changeTab(tab) {
    if (tab === activeTab) return;

    setShowZeroOnly(false);
    setEditingUrl(null);
    setActiveTab(String(tab));
  }

  async function renameTab(oldTab, newName) {
  const cleanNewName = newName.trim();

  if (!cleanNewName) return;
  if (String(oldTab) === cleanNewName) return;

  try {
    const res = await fetch(
      `${API_URL}/api/splitters/${splitter.id}/tabs/${encodeURIComponent(oldTab)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newTab: cleanNewName,
        }),
      }
    );

    if (!res.ok) throw new Error("Erro ao renomear split");

    setTabs((prev) =>
      prev.map((tab) =>
        String(tab.tab) === String(oldTab)
          ? { ...tab, tab: cleanNewName }
          : tab
      )
    );

    setAllLinks((prev) =>
      prev.map((link) =>
        String(link.tab || "1") === String(oldTab)
          ? { ...link, tab: cleanNewName }
          : link
      )
    );

    setAllRoutes((prev) =>
      prev.map((route) =>
        String(route.tab || "1") === String(oldTab)
          ? { ...route, tab: cleanNewName }
          : route
      )
    );

    if (String(activeTab) === String(oldTab)) {
      setActiveTab(cleanNewName);
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao renomear split");
  }
}

  async function handleCreateSplitTab() {
    if (!splitter?.id) return;

    try {
      const nextTab =
        splitTabs.length > 0
          ? String(Math.max(...splitTabs.map(Number)) + 1)
          : "1";

      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/tabs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tab: nextTab,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar split");

      const created = await res.json();

      setTabs((prev) => [...prev, created]);
      setActiveTab(String(created.tab));
    } catch (err) {
      console.error("Erro ao criar split:", err);
      alert("Erro ao criar split");
    }
  }

  async function handleDeleteSplit(tab) {
    if (!splitter?.id) return;

    const confirmDelete = window.confirm(
      `Excluir split ${tab}? Isso também apagará os links e rotas desse split.`
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/tabs/${tab}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar split");

      setTabs((prev) => prev.filter((item) => String(item.tab) !== String(tab)));
      setAllLinks((prev) => prev.filter((link) => String(link.tab) !== String(tab)));
      setAllRoutes((prev) => prev.filter((route) => String(route.tab) !== String(tab)));

      if (String(activeTab) === String(tab)) {
        const remainingTabs = splitTabs.filter((item) => String(item) !== String(tab));
        setActiveTab(remainingTabs[0] || null);
      }
    } catch (err) {
      console.error("Erro ao deletar split:", err);
      alert("Erro ao deletar split");
    }
  }

  const activeLinks = links.filter((link) => !link.disabled);

  const totalEcpm = links.reduce((sum, link) => {
    return sum + Number(link.ecpm || 0);
  }, 0);

  const computedLinks = calculateProbabilities(activeLinks, {
    alpha: 0.6,
    epsilon: 0.1,
    minProb: 0.05,
    maxProb: 0.6,
    minImpressions: 1000,
  });

  const fetchEcpmFromAPI = useCallback(async () => {
    if (!links.length || !activeTab) return;

    try {
      const res = await fetch(`${API_URL}/api/admanager/ecpm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          splitterId: Number(splitter.id),
          tab: String(activeTab),
          links: links.map((link) => ({
            id: link.id,
            url: link.url,
            tab: String(link.tab || activeTab),
            splitterId: Number(splitter.id),
            utms: getLinkUtms(link),
          })),
        }),
      });

      const result = await res.json();

      if (!result.success) {
        alert("Erro ao buscar eCPM.");
        return;
      }

      const updatedLinks = links.map((link) => {
        const found = result.data.find((item) => item.id === link.id);

        return found
          ? {
              ...link,
              ecpm: found.ecpm,
              impressions: found.impressions,
              revenue: found.revenue,
              tab: String(link.tab || activeTab),
              splitterId: Number(splitter.id),
            }
          : link;
      });

      setAllLinks((prev) =>
        prev.map((link) => {
          const updated = updatedLinks.find((item) => item.id === link.id);
          return updated || link;
        })
      );

      await Promise.all(
        updatedLinks.map((link) =>
          fetch(`${API_URL}/api/links/${link.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ecpm: Number(link.ecpm || 0),
              impressions: Number(link.impressions || 0),
              revenue: Number(link.revenue || 0),
              tab: String(activeTab),
              splitterId: Number(splitter.id),
            }),
          })
        )
      );
    } catch (err) {
      console.error("Erro ao buscar eCPM:", err);
      alert("Erro ao conectar com a API. Verifique se o backend está rodando.");
    }
  }, [links, activeTab, splitter?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEcpmFromAPI();
    }, 1800000);

    return () => clearInterval(interval);
  }, [fetchEcpmFromAPI]);

  const visibleLinks = showZeroOnly
    ? links.filter((link) => link.disabled)
    : links;

  async function handleCreateRoute() {
    if (!splitter?.id || !activeTab) return;

    if (!routeDomain.trim() || !routeSlug.trim()) {
      alert("Preencha domínio e slug.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  domain: routeDomain,
  slug: routeSlug,
  pixelId: routePixelId,
  loaderTitle: routeLoaderTitle,
  loaderSubtitle: routeLoaderSubtitle,
  tab: String(activeTab),
}),
      });

      if (!res.ok) throw new Error("Erro ao criar rota");

      const created = await res.json();

      setAllRoutes((prev) => [
        {
          ...created,
          tab: String(created.tab || activeTab),
        },
        ...prev,
      ]);

      setRouteSlug("");
      setRoutePixelId("");
      setRouteModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar rota:", err);
      alert("Erro ao criar rota");
    }
  }

  async function handleUpdateRoute() {
    if (!editingRoute || !activeTab) return;

    try {
      const res = await fetch(`${API_URL}/api/routes/${editingRoute.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        domain: routeDomain,
        slug: routeSlug,
        pixelId: routePixelId,
        loaderTitle: routeLoaderTitle,
        loaderSubtitle: routeLoaderSubtitle,
        tab: String(activeTab),
}),
      });

      if (!res.ok) {
        throw new Error("Erro ao atualizar rota");
      }

      const updated = await res.json();

      setAllRoutes((prev) =>
        prev.map((route) => (route.id === updated.id ? updated : route))
      );

      setEditingRoute(null);
      setRouteModalOpen(false);
      setRouteSlug("");
      setRoutePixelId("");
      setRouteLoaderTitle("");
      setRouteLoaderSubtitle("");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar rota");
    }
  }

  async function handleDeleteRoute(id) {
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta rota?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/routes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar rota");

      setAllRoutes((prev) => prev.filter((route) => route.id !== id));
    } catch (err) {
      console.error("Erro ao deletar rota:", err);
      alert("Erro ao deletar rota");
    }
  }
function handleEditRoute(route) {
  setEditingRoute(route);

  setRouteDomain(route.domain || "");
  setRouteSlug(route.slug || "");
  setRoutePixelId(route.pixelId || "");

  setRouteLoaderTitle(route.loaderTitle || "");
  setRouteLoaderSubtitle(route.loaderSubtitle || "");

  setRouteModalOpen(true);
}

  function getRouteUrl(route) {
    return `${String(route.domain).replace(/\/+$/, "")}/${String(
      route.slug
    ).replace(/^\/+/, "")}`;
  }

  async function copyRoute(route) {
    const url = getRouteUrl(route);

    try {
      await navigator.clipboard.writeText(url);
      alert("Rota copiada!");
    } catch {
      alert(url);
    }
  }

  async function handleCreateLink(newLink) {
    if (!splitter?.id || !activeTab) return;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: newLink.url,
          type: newLink.type || "Landing Page",
          utms: newLink.utms || extractUtmsFromUrl(newLink.url),
          tab: String(activeTab),
          splitterId: Number(splitter.id),
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar link");

      const created = await res.json();

      const safeCreated = {
        ...created,
        tab: String(created.tab || activeTab),
        splitterId: Number(created.splitterId || splitter.id),
      };

      setAllLinks((prev) => [safeCreated, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar link:", err);
      alert("Erro ao criar link");
    }
  }

  async function handleDeleteLink(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este link?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/api/links/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao deletar link no backend");

      setAllLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      console.error("Erro ao deletar link:", err);
      alert("Erro ao deletar link");
    }
  }

  async function updateLink(id, field, value) {
    setAllLinks((prev) =>
      prev.map((link) => (link.id === id ? { ...link, [field]: value } : link))
    );

    try {
      await fetch(`${API_URL}/api/links/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [field]: value,
          tab: String(activeTab),
          splitterId: Number(splitter.id),
        }),
      });
    } catch (err) {
      console.error("Erro ao atualizar link:", err);
    }
  }

  async function handleSaveEditedUrl(updatedLink) {
    const cleanUtms = getLinkUtms(updatedLink);

    const payload = {
      ...updatedLink,
      utms: cleanUtms,
      tab: String(updatedLink.tab || activeTab),
      splitterId: Number(splitter.id),
    };

    setAllLinks((prev) =>
      prev.map((link) => (link.id === payload.id ? payload : link))
    );

    try {
      await fetch(`${API_URL}/api/links/${payload.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: payload.url,
          baseUrl: payload.baseUrl,
          utms: cleanUtms,
          tab: payload.tab,
          splitterId: payload.splitterId,
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar URL:", err);
      alert("Erro ao salvar URL");
    }

    setEditingUrl(null);
  }

  async function toggleLinkStatus(id) {
    const current = allLinks.find((link) => link.id === id);
    if (!current) return;

    const nextDisabled = !current.disabled;

    setAllLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, disabled: nextDisabled } : link
      )
    );

    try {
      await fetch(`${API_URL}/api/links/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disabled: nextDisabled,
          tab: String(activeTab),
          splitterId: Number(splitter.id),
        }),
      });
    } catch (err) {
      console.error("Erro ao alterar status:", err);
    }
  }

  function getLinkProb(link) {
    if (link.disabled) return "0.00";

    const found = computedLinks.find((item) => item.id === link.id);

    return found ? (found.prob * 100).toFixed(2) : "0.00";
  }

  return (
    <>
      {hasConfiguredSplits && (
        <div className="links-toolbar">
          <div className="status-dot"></div>

          <input
            className="split-name-input"
            value={splitter?.category || ""}
            readOnly
          />

          {splitTabs.map((tab) => (
            <div
  key={tab}
  className="tab-wrapper"
>
              <button
  className={`tab-button ${activeTab === tab ? "active" : ""}`}
  onClick={() => changeTab(tab)}
  onDoubleClick={() => {
    setEditingTab(tab);
    setEditingName(tab);
  }}
>
  {editingTab === tab ? (
    <input
      autoFocus
      value={editingName}
      onChange={(e) => setEditingName(e.target.value)}
      onBlur={() => {
        renameTab(tab, editingName);
        setEditingTab(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          renameTab(tab, editingName);
          setEditingTab(null);
        }

        if (e.key === "Escape") {
          setEditingTab(null);
        }
      }}
    />
  ) : (
    tab
  )}
</button>

              <button
                className="tab-delete-button"
                onClick={() => handleDeleteSplit(tab)}
                title={`Excluir split ${tab}`}
              >
                ×
              </button>
            </div>
          ))}

          <button className="tab-button" onClick={handleCreateSplitTab}>
            +
          </button>

          <div className="toolbar-spacer"></div>

         <div className="toolbar-pill">${totalEcpm.toFixed(2)}</div>

<div
  className="toolbar-pill"
  title={
    gamStatus?.lastSync
      ? `Última sync: ${new Date(gamStatus.lastSync).toLocaleString("pt-BR")}`
      : "GAM sem sincronização"
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}
>
  <img
    src="https://www.google.com/images/branding/product/2x/admanager_48dp.png"
    alt="GAM"
    style={{
      width: "18px",
      height: "18px",
      borderRadius: "4px",
    }}
  />

  <span>
    {gamStatus?.lastSync
      ? new Date(gamStatus.lastSync).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--"}
  </span>
</div>

          <button
            className={`eye-button ${showZeroOnly ? "active" : ""}`}
            onClick={() => setShowZeroOnly(!showZeroOnly)}
            title="Mostrar apenas links desativados"
          >
            👁
          </button>
        </div>
      )}

      <section className="page-header">
        <div>
          <h1>GERENCIAR LINKS</h1>
          <p>
            Adicione e configure URL e Tipo dos seus links para a rota de
            redirecionamento.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {!hasConfiguredSplits ? (
            <button className="new-button" onClick={handleCreateSplitTab}>
              Criar novo split
            </button>
          ) : (
            <>
              <button className="new-button" onClick={() => setRouteModalOpen(true)}>
                Adicionar rota
              </button>

              <button className="new-button" onClick={() => setModalOpen(true)}>
                Nova URL
              </button>
            </>
          )}
        </div>
      </section>

      {!hasConfiguredSplits ? (
        <section style={{ marginTop: "28px", color: "#888" }}>
          Nenhum split configurado.
        </section>
      ) : (
        <>
          <section style={{ marginBottom: "18px" }}>
            <h3 style={{ marginBottom: "10px" }}>Rotas do split</h3>

            {routes.length === 0 && (
              <p style={{ color: "#888" }}>Nenhuma rota cadastrada.</p>
            )}

            {routes.map((route) => (
              <div
                key={route.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                  padding: "10px",
                  border: "1px solid #222",
                  borderRadius: "8px",
                }}
              >
                <span style={{ flex: 1 }}>{getRouteUrl(route)}</span>

                <div className="route-actions">
                  <button className="route-button" onClick={() => copyRoute(route)}>
                    Copiar
                  </button>

                  <button
                    className="route-button"
                    onClick={() => handleEditRoute(route)}
                  >
                    Editar
                  </button>

                  <button
                    className="route-button danger"
                    onClick={() => handleDeleteRoute(route.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </section>

          <div className="links-table">
            <div className="links-row links-header">
              <span>eCPM (USD)</span>
              <span>URL</span>
              <span>Imp.</span>
              <span>Prob.</span>
              <span>Tipo</span>
              <span>Ações</span>
            </div>



            {visibleLinks.length === 0 && (
              <p style={{ color: "#888", padding: "18px" }}>
                {showZeroOnly ? "Nenhum link desativado." : "Nenhum link adicionado."}
              </p>
            )}

            {visibleLinks.map((link) => (
              <div
                className={`links-row ${link.disabled ? "disabled-row" : ""}`}
                key={`${splitter?.id}-${activeTab}-${link.id}`}
              >
                <input value={`$${Number(link.ecpm || 0).toFixed(2)}`} readOnly />

                <div className="url-cell">
                  <span>{link.url}</span>
                  <button onClick={() => setEditingUrl(link)}>✎</button>
                </div>

                <input
                  value={Number(link.impressions || 0).toLocaleString("pt-BR")}
                  readOnly
                />

                <input value={`${getLinkProb(link)}%`} readOnly />

                <select
                  value={link.type || "Landing Page"}
                  onChange={(e) => updateLink(link.id, "type", e.target.value)}
                >
                  <option>Landing Page</option>
                  <option>Artigo</option>
                  <option>Art De Lista</option>
                  <option>Art Especifico</option>
                </select>

                <div className="link-actions">
                  <button onClick={() => handleDeleteLink(link.id)}>🗑</button>
                  <button onClick={() => toggleLinkStatus(link.id)}>
                    {link.disabled ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}
                    </div>

          <div className="add-url-bottom">
            <button
              className="new-button"
              onClick={() => setModalOpen(true)}
            >
              + Adicionar nova URL
            </button>
          </div>
        </>
      )}

      {routeModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingRoute ? "Editar rota" : "Adicionar rota"}</h2>

            <label>Domínio</label>
            <input
              value={routeDomain}
              onChange={(e) => setRouteDomain(e.target.value)}
              placeholder="https://split2.up.railway.app/go"
            />

            <label>Slug</label>
            <input
              value={routeSlug}
              onChange={(e) => setRouteSlug(e.target.value)}
              placeholder="adicione seu slug"
            />

            <label>Pixel ID</label>
<input
  value={routePixelId}
  onChange={(e) => setRoutePixelId(e.target.value)}
  placeholder="1006617537466411"
/>

<label>Título do loader</label>
<input
  value={routeLoaderTitle}
  onChange={(e) => setRouteLoaderTitle(e.target.value)}
  placeholder="Adicione o seu título..."
/>

<label>Subtítulo do loader</label>
<input
  value={routeLoaderSubtitle}
  onChange={(e) => setRouteLoaderSubtitle(e.target.value)}
  placeholder="Adicione seu subtitulo..."
/>

            <p style={{ color: "#888", marginTop: "8px" }}>
              URL final:{" "}
              {routeDomain && routeSlug
                ? `${routeDomain.replace(/\/+$/, "")}/${routeSlug.replace(
                    /^\/+/,
                    ""
                  )}`
                : "-"}
            </p>

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                className="new-button"
                onClick={editingRoute ? handleUpdateRoute : handleCreateRoute}
              >
                Salvar rota
              </button>

              <button
                className="mini-button"
                onClick={() => {
                  setEditingRoute(null);
                  setRouteModalOpen(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <LinkModal
          onClose={() => setModalOpen(false)}
          onSave={handleCreateLink}
        />
      )}

      {editingUrl && (
        <EditUrlModal
          link={editingUrl}
          project={project}
          onClose={() => setEditingUrl(null)}
          onSave={handleSaveEditedUrl}
        />
      )}
    </>
  );
}