import {
  Pencil,
  Trash2,
  RefreshCcw,
  FileBarChart2,
  Plus,
} from "lucide-react";

import { useEffect, useState } from "react";
import GamConnectionModal from "../components/GamConnectionModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdManager() {
  const [connections, setConnections] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);

  async function loadConnections() {
    try {
      const response = await fetch(`${API_URL}/api/gam/connections`);
      const data = await response.json();

      setConnections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
    }
  }

  function openCreateModal() {
    setEditingConnection(null);
    setModalOpen(true);
  }

  function openEditModal(connection) {
    setEditingConnection(connection);
    setModalOpen(true);
  }

  async function saveConnection(payload) {
    const isEditing = Boolean(editingConnection);

    const url = isEditing
      ? `${API_URL}/api/gam/connections/${editingConnection.id}`
      : `${API_URL}/api/gam/connections`;

    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("Resposta salvar GAM:", data);

      if (!response.ok) {
        alert(data.error || "Erro ao salvar GAM");
        return;
      }

      setModalOpen(false);
      setEditingConnection(null);

      await loadConnections();
    } catch (error) {
      console.error("Erro ao salvar conexão:", error);
      alert("Erro ao salvar conexão. Veja o console.");
    }
  }

  async function deleteConnection(id) {
    const confirmed = confirm(
      "Deseja remover esta conexão?"
    );

    if (!confirmed) return;

    try {
      await fetch(
        `${API_URL}/api/gam/connections/${id}`,
        {
          method: "DELETE",
        }
      );

      await loadConnections();
    } catch (error) {
      console.error("Erro ao deletar conexão:", error);
    }
  }

  async function syncConnection(id) {
    try {
      alert("Sync iniciado para o GAM ID: " + id);

      // próxima etapa:
      // POST `${API_URL}/api/gam/sync/${id}`
    } catch (error) {
      console.error("Erro ao sincronizar GAM:", error);
    }
  }

  useEffect(() => {
    loadConnections();
  }, []);

  return (
    <div className="admanager-page">
      <div className="admanager-header">
        <div>
          <h1>Contas Ad Manager</h1>

          <p>
            Gerencie suas conexões GAM e
            relatórios automáticos.
          </p>
        </div>

        <button
          className="connect-btn"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Conectar Nova Conta
        </button>
      </div>

      <div className="gam-connections">
        {connections.map((gam) => (
          <div className="gam-card" key={gam.id}>
            <div className="gam-top">
              <div>
                <h2>{gam.name}</h2>

                <span>
                  ID: {gam.networkCode}
                </span>
              </div>

              <div className="gam-actions">
                <button
                  className="icon-btn"
                  onClick={() =>
                    openEditModal(gam)
                  }
                >
                  <Pencil size={16} />
                </button>

                <button
                  className="icon-btn danger"
                  onClick={() =>
                    deleteConnection(gam.id)
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="gam-status">
              <span className="status-dot"></span>
              {gam.status}
            </div>

            <div className="gam-info-grid">
              <div className="gam-info-box">
                <FileBarChart2 size={16} />

                <div>
                  <span>Tipo de relatório</span>

                  <strong>
                    {gam.reportType ||
                      "utm_campaign"}
                  </strong>
                </div>
              </div>

              <div className="gam-info-box">
                <RefreshCcw size={16} />

                <div>
                  <span>
                    Última sincronização
                  </span>

                  <strong>
                    {gam.lastSyncAt
                      ? new Date(
                          gam.lastSyncAt
                        ).toLocaleString()
                      : "Nunca"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="gam-card-footer">
              <button
                className="sync-btn"
                onClick={() =>
                  syncConnection(gam.id)
                }
              >
                <RefreshCcw size={16} />
                Sincronizar agora
              </button>
            </div>
          </div>
        ))}
      </div>

      <GamConnectionModal
        open={modalOpen}
        connection={editingConnection}
        onClose={() => {
          setModalOpen(false);
          setEditingConnection(null);
        }}
        onSave={saveConnection}
      />
    </div>
  );
}