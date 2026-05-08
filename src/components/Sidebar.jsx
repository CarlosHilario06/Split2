import { useState } from "react";

import {
  FolderKanban,
  Link2,
  LogOut,
  ChevronLeft,
  ChevronRight,
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
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
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