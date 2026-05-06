import { useEffect, useState } from "react";
import SplitterCard from "../components/SplitterCard";
import SplitterModal from "../components/SplitterModal";

const API_URL = "https://split2.up.railway.app";

export default function Splitters({ project, onBack, onOpenSplitter }) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [splitters, setSplitters] = useState([]);

  async function loadSplitters() {
    if (!project?.id) return;

    try {
      const res = await fetch(`${API_URL}/api/projects/${project.id}/splitters`);
      const data = await res.json();
      setSplitters(data);
    } catch (err) {
      console.error("Erro ao carregar splitters:", err);
      alert("Erro ao carregar splitters");
    }
  }

  useEffect(() => {
    loadSplitters();
  }, [project?.id]);

  const filteredSplitters = splitters.filter((splitter) =>
    `${splitter.category || ""} ${splitter.location || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleCreateSplitter(newSplitter) {
    try {
      const res = await fetch(`${API_URL}/api/projects/${project.id}/splitters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: newSplitter.category,
          location: newSplitter.location || "",
        }),
      });

      const createdSplitter = await res.json();

      setSplitters((prev) => [createdSplitter, ...prev]);
      setModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar splitter:", err);
      alert("Erro ao criar splitter");
    }
  }

  function handleEditSplitter(splitter) {
    onOpenSplitter(splitter);
  }

  async function handleDeleteSplitter(id) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este split?"
    );

    if (!confirmDelete) return;

    try {
      await fetch(`${API_URL}/api/splitters/${id}`, {
        method: "DELETE",
      });

      setSplitters((prev) => prev.filter((splitter) => splitter.id !== id));
    } catch (err) {
      console.error("Erro ao deletar splitter:", err);
      alert("Erro ao deletar splitter");
    }
  }

  return (
    <>
      <div className="splitters-top">
        <button className="back-button" onClick={onBack}>
          ← Voltar
        </button>

        <strong className="project-name-label">{project?.name}</strong>
      </div>

      <section className="page-header">
        <div>
          <h1>SPLITTERS</h1>
          <p>Aqui você poderá visualizar e editar os splits deste projeto.</p>
        </div>

        <button className="new-button" onClick={() => setModalOpen(true)}>
          Novo +
        </button>
      </section>

      <input
        className="search-input"
        placeholder="Pesquisar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredSplitters.length === 0 && (
        <p style={{ color: "#888", marginTop: "20px" }}>
          Nenhum split encontrado.
        </p>
      )}

      <section className="projects-grid">
        {filteredSplitters.map((splitter) => (
          <SplitterCard
            key={splitter.id}
            splitter={splitter}
            onEdit={handleEditSplitter}
            onDelete={handleDeleteSplitter}
          />
        ))}
      </section>

      {modalOpen && (
        <SplitterModal
          onClose={() => setModalOpen(false)}
          onSave={handleCreateSplitter}
        />
      )}
    </>
  );
}