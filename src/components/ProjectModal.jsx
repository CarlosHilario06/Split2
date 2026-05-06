import { useState } from "react";

export default function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Digite o nome do projeto");
      return;
    }

    onSave(form);
  }

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={handleSubmit}>
        <button type="button" className="close-button" onClick={onClose}>
          ✕
        </button>

        {/* 👇 TÍTULO SEM ÍCONE */}
        <div className="modal-header">
          <h2>
            {project ? "Editar Projeto" : "Criar Projeto"}
          </h2>

          <p>
            Um projeto é onde será armazenado o conteúdo relacionado. Preencha
            as informações abaixo.
          </p>
        </div>

        <input
          placeholder="Nome do projeto"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          placeholder="Descrição do projeto"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="modal-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="save-button">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}