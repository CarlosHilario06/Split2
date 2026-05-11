import {
  Pencil,
  Trash2,
  RefreshCcw,
  FileBarChart2,
  Plus,
} from "lucide-react";

import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function AdManager() {
  const [connections, setConnections] = useState([]);

  async function loadConnections() {
  try {
    const response = await fetch(`${API_URL}/api/gam/connections`);
    const data = await response.json();

    console.log("Conexões GAM:", data);

    setConnections(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("Erro ao buscar conexões:", error);
  }
}

  async function createConnection() {
  const name = prompt("Nome da conta GAM:");
  if (!name) return;

  const networkCode = prompt("Network Code:");
  if (!networkCode) return;

  try {
    const response = await fetch(`${API_URL}/api/gam/connections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, networkCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao criar conexão");
      return;
    }

    alert("Conta criada com sucesso!");
    await loadConnections();
  } catch (error) {
    console.error("Erro ao criar conexão:", error);
    alert("Erro ao criar conexão. Veja o console.");
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

      loadConnections();
    } catch (error) {
      console.error("Erro ao deletar conexão:", error);
    }
  }

  async function editConnection(connection) {
    const newName = prompt(
      "Novo nome:",
      connection.name
    );

    if (!newName) return;

    try {
      await fetch(
        `${API_URL}/api/gam/connections/${connection.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: newName,
          }),
        }
      );

      loadConnections();
    } catch (error) {
      console.error("Erro ao editar conexão:", error);
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
          onClick={createConnection}
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
                    editConnection(gam)
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
                  <span>Relatórios ativos</span>
                  <strong>0</strong>
                </div>
              </div>

              <div className="gam-info-box">
                <RefreshCcw size={16} />

                <div>
                  <span>Última sincronização</span>

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
          </div>
        ))}
      </div>
    </div>
  );
}