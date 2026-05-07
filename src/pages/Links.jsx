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
  const [activeTab, setActiveTab] = useState("1");
  const [links, setLinks] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeDomain, setRouteDomain] = useState("https://split2.up.railway.app/go");
  const [routeSlug, setRouteSlug] = useState("");
  const [routePixelId, setRoutePixelId] = useState("");
  const [editingRoute, setEditingRoute] = useState(null);
  const [editingUrl, setEditingUrl] = useState(null);
  const [showZeroOnly, setShowZeroOnly] = useState(false);

  const loadRequestRef = useRef(0);

  async function loadLinks(tab = activeTab) {
    if (!splitter?.id) return;

    const currentSplitterId = Number(splitter.id);
    const currentTab = String(tab);
    const requestId = ++loadRequestRef.current;

    try {
      const res = await fetch(
        `${API_URL}/api/splitters/${currentSplitterId}/links?tab=${encodeURIComponent(
          currentTab
        )}`
      );

      if (!res.ok) throw new Error("Erro ao carregar links");

      const data = await res.json();

      if (requestId !== loadRequestRef.current) return;

      const safeLinks = data
        .map((link) => ({
          ...link,
          tab: String(link.tab || currentTab),
        }))
        .filter((link) => {
          const sameTab = String(link.tab) === currentTab;
          const sameSplitter =
            Number(link.splitterId) === currentSplitterId ||
            Number(link.splitter?.id) === currentSplitterId;

          return sameTab && sameSplitter;
        });

      setLinks(safeLinks);
    } catch (err) {
      console.error("Erro ao carregar links:", err);
      alert("Erro ao carregar links");
    }
  }

  async function loadRoutes() {
    if (!splitter?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/splitters/${splitter.id}/routes?tab=${activeTab}`);

      if (!res.ok) throw new Error("Erro ao carregar rotas");

      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.error("Erro ao carregar rotas:", err);
      alert("Erro ao carregar rotas");
    }
  }

  useEffect(() => {
    setLinks([]);
    loadLinks(activeTab);
    loadRoutes();
  }, [splitter?.id, activeTab]);

  function changeTab(tab) {
    if (tab === activeTab) return;

    setShowZeroOnly(false);
    setEditingUrl(null);
    setLinks([]);
    setActiveTab(tab);
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
    if (!links.length) return;

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

      setLinks(updatedLinks);

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
    if (!splitter?.id) return;

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
  tab: String(activeTab),
}),
      });

      if (!res.ok) throw new Error("Erro ao criar rota");

      const created = await res.json();

      setRoutes((prev) => [created, ...prev]);
      setRouteSlug("");
      setRoutePixelId("");
      setRouteModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar rota:", err);
      alert("Erro ao criar rota");
    }
  }

  async function handleUpdateRoute() {
  if (!editingRoute) return;

  try {
    const res = await fetch(
      `${API_URL}/api/routes/${editingRoute.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: routeDomain,
          slug: routeSlug,
          pixelId: routePixelId,
          tab: String(activeTab),
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao atualizar rota");
    }

    const updated = await res.json();

    setRoutes((prev) =>
      prev.map((route) =>
        route.id === updated.id ? updated : route
      )
    );

    setEditingRoute(null);
    setRouteModalOpen(false);

    setRouteSlug("");
    setRoutePixelId("");
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

      setRoutes((prev) => prev.filter((route) => route.id !== id));
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
    if (!splitter?.id) return;

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

      setLinks((prev) => [safeCreated, ...prev]);
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

      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      console.error("Erro ao deletar link:", err);
      alert("Erro ao deletar link");
    }
  }

  async function updateLink(id, field, value) {
    setLinks((prev) =>
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

    setLinks((prev) =>
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
    const current = links.find((link) => link.id === id);
    if (!current) return;

    const nextDisabled = !current.disabled;

    setLinks((prev) =>
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
      <div className="links-toolbar">
        <button className="back-button" onClick={onBack}>
          « Voltar
        </button>

        <div className="status-dot"></div>

        <input
          className="split-name-input"
          value={splitter?.category || ""}
          readOnly
        />

        <button
          className={`tab-button ${activeTab === "1" ? "active" : ""}`}
          onClick={() => changeTab("1")}
        >
          1
        </button>

        <button
          className={`tab-button ${activeTab === "2" ? "active" : ""}`}
          onClick={() => changeTab("2")}
        >
          2
        </button>

        <div className="toolbar-spacer"></div>

        <div className="toolbar-pill">${totalEcpm.toFixed(2)}</div>
        <div className="toolbar-pill strong-pill">eCPM</div>

        <button
          className={`eye-button ${showZeroOnly ? "active" : ""}`}
          onClick={() => setShowZeroOnly(!showZeroOnly)}
          title="Mostrar apenas links desativados"
        >
          👁
        </button>

      </div>

      <section className="page-header">
        <div>
          <h1>GERENCIAR LINKS</h1>
          <p>
            Adicione e configure URL e Tipo dos seus links para a rota de
            redirecionamento.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="new-button" onClick={() => setRouteModalOpen(true)}>
            Adicionar rota
          </button>

          <button className="new-button" onClick={() => setModalOpen(true)}>
            Novo +
          </button>
        </div>
      </section>

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
      <span style={{ flex: 1 }}>
        {getRouteUrl(route)}
      </span>

      <div className="route-actions">
        <button onClick={() => copyRoute(route.slug)}>
          Copiar
        </button>

        <button onClick={() => handleEditRoute(route)}>
          Editar
        </button>

<button onClick={() => handleDeleteRoute(route.id)}>          🗑
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

      {routeModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Adicionar rota</h2>

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
              placeholder="paskola"
            />

            <label>Pixel ID</label>
            <input
              value={routePixelId}
              onChange={(e) => setRoutePixelId(e.target.value)}
              placeholder="1006617537466411"
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
              <button className="new-button" onClick={ 
                                             editingRoute
                                               ? handleUpdateRoute
                                              : handleCreateRoute
                                            }
              >
                Salvar rota
              </button>

              <button
                className="mini-button"
                onClick={() => setRouteModalOpen(false)}
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