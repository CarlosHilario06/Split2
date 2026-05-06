import { useEffect, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import ProjectModal from "../components/ProjectModal";

const API_URL = "https://split2.up.railway.app";

export default function Projects({ onManageProject }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projects, setProjects] = useState([]);

  async function loadProjects() {
    try {
      const res = await fetch(`${API_URL}/api/projects`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Erro ao carregar projetos:", err);
      alert("Erro ao carregar projetos");
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreateProject(newProject) {
    try {
      if (editingProject) {
        // edição ainda não está ligada no backend
        setProjects(
          projects.map((project) =>
            project.id === editingProject.id
              ? { ...project, ...newProject }
              : project
          )
        );

        setEditingProject(null);
      } else {
        const res = await fetch(`${API_URL}/api/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newProject.name,
          }),
        });

        const createdProject = await res.json();

        setProjects((prev) => [createdProject, ...prev]);
      }

      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar projeto:", err);
      alert("Erro ao salvar projeto");
    }
  }

  async function handleDeleteProject(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este projeto?"
    );

    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/api/projects/${id}`, {
        method: "DELETE",
      });

      setProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (err) {
      console.error("Erro ao excluir projeto:", err);
      alert("Erro ao excluir projeto");
    }
  }

  function handleEditProject(project) {
    setEditingProject(project);
    setModalOpen(true);
  }

  function handleManageProject(project) {
    onManageProject(project);
  }

  function handleCloseModal() {
    setEditingProject(null);
    setModalOpen(false);
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>OPERAÇÂO</h1>
          <p>Aqui você poderá visualizar e editar suas operações.</p>
        </div>

        <button className="new-button" onClick={() => setModalOpen(true)}>
          Novo +
        </button>
      </section>

      <input
        className="search-input"
        placeholder="Pesquisar projetos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredProjects.length === 0 && (
        <p style={{ color: "#888", marginTop: "20px" }}>
          Nenhum projeto encontrado.
        </p>
      )}

      <section className="projects-grid">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onManage={handleManageProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        ))}
      </section>

      {modalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={handleCloseModal}
          onSave={handleCreateProject}
        />
      )}
    </>
  );
}