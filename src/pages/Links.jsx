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
}