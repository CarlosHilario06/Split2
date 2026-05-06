import { useEffect, useState } from "react";

export default function SplitterModal({ onClose, onSave }) {
  // 🔥 CARREGA DO LOCALSTORAGE
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("splitter-categories");
    return saved ? JSON.parse(saved) : ["Categoria exemplo"];
  });

  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem("splitter-locations");
    return saved ? JSON.parse(saved) : ["Local/Língua exemplo"];
  });

  const [form, setForm] = useState({
    category: "",
    location: "",
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewLocation, setShowNewLocation] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // 🔥 SALVA AUTOMATICAMENTE
  useEffect(() => {
    localStorage.setItem("splitter-categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("splitter-locations", JSON.stringify(locations));
  }, [locations]);

  function addCategory() {
    if (!newCategory.trim()) return;

    const value = newCategory.trim();

    setCategories([...categories, value]);
    setForm({ ...form, category: value });

    setNewCategory("");
    setShowNewCategory(false);
  }

  function addLocation() {
    if (!newLocation.trim()) return;

    const value = newLocation.trim();

    setLocations([...locations, value]);
    setForm({ ...form, location: value });

    setNewLocation("");
    setShowNewLocation(false);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.category || !form.location) {
      alert("Preencha tudo");
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

        <h2>Criar Splitter</h2>

        <p>
          Um splitter é onde será armazenado seus splits, usados para funil e
          broadcasting.
        </p>

        {/* CATEGORY */}
        <select
          value={form.category}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowNewCategory(true);
            } else {
              setForm({ ...form, category: e.target.value });
            }
          }}
        >
          <option value="">Selecionar Categoria</option>

          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}

          <option value="__new__">➕ Criar nova categoria</option>
        </select>

        {showNewCategory && (
          <div className="mini-create">
            <input
              placeholder="Nova categoria"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="button" onClick={addCategory}>
              OK
            </button>
          </div>
        )}

        {/* LOCATION */}
        <select
          value={form.location}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setShowNewLocation(true);
            } else {
              setForm({ ...form, location: e.target.value });
            }
          }}
        >
          <option value="">Selecionar Local/Língua</option>

          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}

          <option value="__new__">➕ Criar novo local</option>
        </select>

        {showNewLocation && (
          <div className="mini-create">
            <input
              placeholder="Novo local/língua"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
            <button type="button" onClick={addLocation}>
              OK
            </button>
          </div>
        )}

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