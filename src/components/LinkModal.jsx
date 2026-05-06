import { useState } from "react";

export default function LinkModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    url: "",
    type: "",
  });

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.url || !form.type) {
      alert("Preencha a URL e o tipo do link");
      return;
    }

    onSave(form);
  }

  return (
    <div className="modal-overlay">
      <form className="modal small-modal" onSubmit={handleSubmit}>
        <button type="button" className="close-button" onClick={onClose}>
          ✕
        </button>

        <h2>Criar Link</h2>

        <p>
          Este link ficará disponível para o sistema de redistribuição de rotas
          do split.
        </p>

        <input
          placeholder="Digite a URL do Link"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="">Selecione o tipo do Link</option>
          <option value="Landing Page">Landing Page</option>
          <option value="Offer">Offer</option>
          <option value="Prelander">Prelander</option>
          <option value="Redirect">Redirect</option>
        </select>

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