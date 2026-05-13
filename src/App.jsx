import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Projects from "./pages/Projects";
import Settings from "./pages/Settings";
import Splitters from "./pages/Splitters";
import Links from "./pages/Links";
import Utms from "./pages/Utms";
import Login from "./pages/Login";
import AdManager from "./pages/AdManager";

import Analytics from "./pages/Analytics";
import GanhoPorVisita from "./pages/GanhoPorVisita";
import PicoBroad from "./pages/PicoBroad";
import TrafegoDia from "./pages/TrafegoDia";
import ScrollPermanencia from "./pages/ScrollPermanencia";
import RendimentoSplit from "./pages/RendimentoSplit";
import LeadsCampanha from "./pages/LeadsCampanha";

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

  if (!isLogged) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        selectedProject={selectedProject}
        openUtms={openUtms}
        onLogout={handleLogout}
      />

      <main className="main">
        <div className="global-breadcrumb">
          <span className="breadcrumb-link" onClick={backToProjects}>
            Projetos
          </span>

          {selectedProject && (
            <>
              <span className="breadcrumb-separator">›</span>

              <span
                className={
                  activePage === "splitters"
                    ? "breadcrumb-current"
                    : "breadcrumb-link"
                }
                onClick={backToSplitters}
              >
                {selectedProject?.name || selectedProject?.title || "Projeto"}
              </span>
            </>
          )}

          {activePage === "links" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Gerenciar links</span>
            </>
          )}

          {activePage === "utms" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">UTMs</span>
            </>
          )}

          {activePage === "settings" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Configurações</span>
            </>
          )}

          {activePage === "admanager" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Ad Manager</span>
            </>
          )}

          {activePage === "analytics" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Analytics</span>
            </>
          )}

          {activePage === "ganhoPorVisita" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                Ganho por Visita
              </span>
            </>
          )}

          {activePage === "picoBroad" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Pico do Broad</span>
            </>
          )}

          {activePage === "trafegoDia" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Tráfego por Dia</span>
            </>
          )}

          {activePage === "scrollPermanencia" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                Scroll & Permanência
              </span>
            </>
          )}

          {activePage === "rendimentoSplit" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                Rendimento por Split
              </span>
            </>
          )}

          {activePage === "leadsCampanha" && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                Leads por Campanha
              </span>
            </>
          )}
        </div>

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
          />
        )}

        {activePage === "admanager" && <AdManager />}

        {activePage === "analytics" && <Analytics />}

        {activePage === "ganhoPorVisita" && <GanhoPorVisita />}

        {activePage === "picoBroad" && <PicoBroad />}

        {activePage === "trafegoDia" && <TrafegoDia />}

        {activePage === "scrollPermanencia" && (
          <ScrollPermanencia />
        )}

        {activePage === "rendimentoSplit" && (
          <RendimentoSplit />
        )}

        {activePage === "leadsCampanha" && (
          <LeadsCampanha />
        )}
      </main>
    </div>
  );
}