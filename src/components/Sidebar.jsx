import { useState } from "react";

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
  {collapsed ? "›" : "‹"}
</button>

        <button
          className={activePage === "projects" ? "active" : ""}
          onClick={() => setActivePage("projects")}
        >
          📁 {!collapsed && "Projetos"}
        </button>

        <button
          className={activePage === "utms" ? "active" : ""}
          onClick={openUtms}
        >
          🧩 {!collapsed && "UTMs"}
        </button>
      </div>

      <div className="sidebar-bottom">

        <button className="logout" onClick={onLogout}>
          🚪 {!collapsed && "Sair"}
        </button>
      </div>
    </aside>
  );
}