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
  const [routeDomain, setRouteDomain] = useState("https://bz.topleadz.com");
  const [routeSlug, setRouteSlug] = useState("");
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
      const res = await fetch(
        `${API_URL}/api/splitters/${splitter.id}/routes?tab=${activeTab}`
      );

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
              tab: String(link.tab || activeTab),
              splitterId: Number(splitter.id),
            }),
          })
        )
      );
    } catch (err) {
      console.error("Erro ao buscar eCPM:", err);
      alert("Erro ao conectar com a API.");
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
      const res = await fetch(
        `${API_URL}/api/splitters/${splitter.id}/routes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain: routeDomain,
            slug: routeSlug,
            tab: String(activeTab),
          }),
        }
      );

      if (!res.ok) throw new Error("Erro ao criar rota");

      const created = await res.json();

      setRoutes((prev) => [created, ...prev]);
      setRouteSlug("");
      setRouteModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar rota:", err);
      alert("Erro ao criar rota");
    }
  }

  async function handleDeleteRoute(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta rota?"
    );

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
      const res = await fetch(
        `${API_URL}/api/splitters/${splitter.id}/links`,
        {
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
        }
      );

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

      if (!res.ok) throw new Error("Erro ao deletar link");

      setLinks((prev) => prev.filter((link) => link.id !== id));
    } catch (err) {
      console.error("Erro ao deletar link:", err);
      alert("Erro ao deletar link");
    }
  }

  return (
    <>
      <div className="splitters-top">
        <button className="back-button" onClick={onBack}>
          ← Voltar
        </button>

        <strong className="project-name-label">
          {project?.name} / {splitter?.category}
        </strong>
      </div>

      <section className="page-header">
        <div>
          <h1>LINKS</h1>
          <p>Gerencie os links e rotas deste split.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="new-button"
            onClick={() => setRouteModalOpen(true)}
          >
            Nova Rota
          </button>

          <button className="new-button" onClick={() => setModalOpen(true)}>
            Novo Link
          </button>
        </div>
      </section>

      <div className="tabs-container">
        {["1", "2", "3", "4"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "tab active" : "tab"}
            onClick={() => changeTab(tab)}
          >
            TAB {tab}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "20px", marginBottom: "20px" }}>
        <strong>eCPM Total:</strong> ${totalEcpm.toFixed(2)}
      </div>

      <button
        className="new-button"
        onClick={() => setShowZeroOnly((prev) => !prev)}
      >
        {showZeroOnly ? "Mostrar Todos" : "Mostrar Zerados"}
      </button>

      <section className="projects-grid" style={{ marginTop: "20px" }}>
        {visibleLinks.map((link) => {
          const calculated = computedLinks.find((l) => l.id === link.id);

          return (
            <div className="project-card" key={link.id}>
              <p>
                <strong>URL:</strong> {link.url}
              </p>

              <p>
                <strong>eCPM:</strong> ${Number(link.ecpm || 0).toFixed(2)}
              </p>

              <p>
                <strong>Revenue:</strong> $
                {Number(link.revenue || 0).toFixed(2)}
              </p>

              <p>
                <strong>Impressions:</strong>{" "}
                {Number(link.impressions || 0)}
              </p>

              <p>
                <strong>Probabilidade:</strong>{" "}
                {calculated
                  ? `${(calculated.probability * 100).toFixed(2)}%`
                  : "0%"}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                }}
              >
                <button onClick={() => setEditingUrl(link)}>
                  Editar
                </button>

                <button onClick={() => handleDeleteLink(link.id)}>
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <section style={{ marginTop: "40px" }}>
        <h2>Rotas</h2>

        {routes.map((route) => (
          <div key={route.id} className="project-card">
            <p>{getRouteUrl(route)}</p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              <button onClick={() => copyRoute(route)}>
                Copiar
              </button>

              <button onClick={() => handleDeleteRoute(route.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </section>

      {modalOpen && (
        <LinkModal
          onClose={() => setModalOpen(false)}
          onSave={handleCreateLink}
        />
      )}

      {editingUrl && (
        <EditUrlModal
          link={editingUrl}
          onClose={() => setEditingUrl(null)}
          onSave={(updated) => {
            setLinks((prev) =>
              prev.map((link) =>
                link.id === updated.id ? updated : link
              )
            );

            setEditingUrl(null);
          }}
        />
      )}

      {routeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nova Rota</h2>

            <input
              placeholder="Domínio"
              value={routeDomain}
              onChange={(e) => setRouteDomain(e.target.value)}
            />

            <input
              placeholder="Slug"
              value={routeSlug}
              onChange={(e) => setRouteSlug(e.target.value)}
            />

            <div className="modal-actions">
              <button onClick={handleCreateRoute}>
                Salvar
              </button>

              <button onClick={() => setRouteModalOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}