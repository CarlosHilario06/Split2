import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Splitters from "./pages/Splitters";
import Links from "./pages/Links";
import Utms from "./pages/Utms";
import Login from "./pages/Login";

export default function App() {
  const [isLogged, setIsLogged] = useState(
    localStorage.getItem("logado") === "true"
  );

  const [activePage, setActivePage] = useState("projects");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSplitter, setSelectedSplitter] = useState(null);
  const [previousPage, setPreviousPage] = useState("splitters");

  function handleLogin() {
    localStorage.setItem("logado", "true");
    setIsLogged(true);
  }

  function handleLogout() {
    localStorage.removeItem("logado");
    setIsLogged(false);
  }

  function openProject(project) {
    setSelectedProject(project);
    setSelectedSplitter(null);
    setActivePage("splitters");
  }

  function openSplitter(splitter) {
    setSelectedSplitter(splitter);
    setActivePage("links");
  }

  function backToProjects() {
    setSelectedProject(null);
    setSelectedSplitter(null);
    setActivePage("projects");
  }

  function backToSplitters() {
    setSelectedSplitter(null);
    setActivePage("splitters");
  }

  function openUtms() {
    setPreviousPage(activePage);
    setActivePage("utms");
  }

  function backFromUtms() {
    setActivePage(previousPage);
  }

  function getBreadcrumb() {
  if (activePage === "projects") {
    return ["Projetos"];
  }

  if (activePage === "splitters") {
    return ["Projetos", selectedProject?.name || "Projeto"];
  }

  if (activePage === "links") {
    return [
      "Projetos",
      selectedProject?.name || "Projeto",
      "Gerenciar links",
    ];
  }

  if (activePage === "utms") {
    return ["UTMs"];
  }

  return [];
}

  // 🔒 Tela de login
  if (!isLogged) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* ✅ Sidebar única */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedProject={selectedProject}
        openUtms={openUtms}
        onLogout={handleLogout}
      />

      <main className="main">
        {activePage === "utms" && (
          <Utms project={selectedProject} onBack={backFromUtms} />
        )}

        {activePage === "projects" && (
          <Projects onManageProject={openProject} />
        )}

        {activePage === "settings" && <Settings />}

        {activePage === "splitters" && (
          <Splitters
            project={selectedProject}
            onBack={backToProjects}
            onOpenSplitter={openSplitter}
          />
        )}

        {activePage === "links" && (
          <Links
            project={selectedProject}
            splitter={selectedSplitter}
            onBack={backToSplitters}
            breadcrumb={getBreadcrumb()}
/>
        )}
      </main>
    </div>
  );
}