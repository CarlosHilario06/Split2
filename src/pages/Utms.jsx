import { useEffect, useState } from "react";

export default function Utms({ project, onBack }) {
  const storageKey = `utms-${project?.id}`;

  const [utms, setUtms] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(utms));
  }, [utms, storageKey]);

  function addUtm() {
    if (!name.trim()) return;

    setUtms([
      ...utms,
      {
        id: Date.now(),
        name: name.trim(),
      },
    ]);

    setName("");
  }

  function deleteUtm(id) {
    setUtms(utms.filter((utm) => utm.id !== id));
  }

  function startEdit(utm) {
    setEditingId(utm.id);
    setEditingValue(utm.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue("");
  }

  function saveEdit(id) {
    if (!editingValue.trim()) return;

    setUtms(
      utms.map((utm) =>
        utm.id === id ? { ...utm, name: editingValue.trim() } : utm
      )
    );

    cancelEdit();
  }

  return (
    <>
      <div className="page-top-actions">
        <button className="back-button" onClick={onBack}>
          « Voltar
        </button>
      </div>

      <section className="page-header">
        <div>
          <h1>UTMS</h1>
          <p>Gerencie as UTMs disponíveis para este projeto.</p>
        </div>
      </section>

      <div className="utm-create">
        <input
          placeholder="Ex: utm_source"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button onClick={addUtm}>Adicionar</button>
      </div>

      <div className="utm-list">
        {utms.length === 0 && <p>Nenhuma UTM cadastrada.</p>}

        {utms.map((utm) => (
          <div className="utm-item" key={utm.id}>
            {editingId === utm.id ? (
              <>
                <input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                />

                <div className="utm-actions">
                  <button onClick={() => saveEdit(utm.id)}>Salvar</button>
                  <button onClick={cancelEdit}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <strong>{utm.name}</strong>

                <div className="utm-actions">
                  <button onClick={() => startEdit(utm)}>Editar</button>
                  <button onClick={() => deleteUtm(utm.id)}>Excluir</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}