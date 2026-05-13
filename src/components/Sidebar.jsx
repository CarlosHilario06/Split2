import { useState } from "react";

import {
  FolderKanban,
  Link2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BadgeDollarSign,
  BarChart3,
  TrendingUp,
  Activity,
  Timer,
  GitBranch,
  Users,
  ClipboardCheck,
} from "lucide-react";

export default function Sidebar({
  activePage,
  setActivePage,
  selectedProject,
  openUtms,
  onLogout,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <button
          className={activePage === "projects" ? "active" : ""}
          onClick={() => setActivePage("projects")}
        >
          <FolderKanban size={18} />
          {!collapsed && <span>Projetos</span>}
        </button>

        <button
          className={activePage === "utms" ? "active" : ""}
          onClick={openUtms}
        >
          <Link2 size={18} />
          {!collapsed && <span>UTMs</span>}
        </button>

        <button
          className={activePage === "admanager" ? "active" : ""}
          onClick={() => setActivePage("admanager")}
        >
          <BadgeDollarSign size={18} />
          {!collapsed && <span>Ad Manager</span>}
        </button>

        <button
          className={activePage === "analytics" ? "active" : ""}
          onClick={() => setActivePage("analytics")}
        >
          <BarChart3 size={18} />
          {!collapsed && <span>Analytics</span>}
        </button>

        <button
          className={activePage === "ganhoPorVisita" ? "active" : ""}
          onClick={() => setActivePage("ganhoPorVisita")}
        >
          <TrendingUp size={18} />
          {!collapsed && <span>Ganho por Visita</span>}
        </button>

        <button
          className={activePage === "picoBroad" ? "active" : ""}
          onClick={() => setActivePage("picoBroad")}
        >
          <Activity size={18} />
          {!collapsed && <span>Pico do Broad</span>}
        </button>

        <button
          className={activePage === "trafegoDia" ? "active" : ""}
          onClick={() => setActivePage("trafegoDia")}
        >
          <BarChart3 size={18} />
          {!collapsed && <span>Tráfego por Dia</span>}
        </button>

        <button
          className={activePage === "scrollPermanencia" ? "active" : ""}
          onClick={() => setActivePage("scrollPermanencia")}
        >
          <Timer size={18} />
          {!collapsed && <span>Scroll & Permanência</span>}
        </button>

        <button
          className={activePage === "rendimentoSplit" ? "active" : ""}
          onClick={() => setActivePage("rendimentoSplit")}
        >
          <GitBranch size={18} />
          {!collapsed && <span>Rendimento por Split</span>}
        </button>

        <button
          className={activePage === "leadsCampanha" ? "active" : ""}
          onClick={() => setActivePage("leadsCampanha")}
        >
          <Users size={18} />
          {!collapsed && <span>Leads por Campanha</span>}
        </button>

        <button
          className={activePage === "analiseManual" ? "active" : ""}
          onClick={() => setActivePage("analiseManual")}
        >
          <ClipboardCheck size={18} />
          {!collapsed && <span>Análise Manual</span>}
        </button>
      </div>

      <div className="sidebar-bottom">
        <button className="logout" onClick={onLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}