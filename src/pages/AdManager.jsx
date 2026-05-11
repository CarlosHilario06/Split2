import {
  Pencil,
  Trash2,
  RefreshCcw,
  FileBarChart2,
  Plus,
} from "lucide-react";

export default function AdManager() {
  const connections = [
    {
      id: 1,
      name: "WinUp - Ursa",
      networkCode: "23292093160",
      status: "Conectado",
      reports: 3,
      lastSync: "Hoje às 09:00",
    },
  ];

  return (
    <div className="admanager-page">
      <div className="admanager-header">
        <div>
          <h1>Contas Ad Manager</h1>
          <p>Gerencie suas conexões GAM e relatórios automáticos.</p>
        </div>

        <button className="connect-btn">
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
                <span>ID: {gam.networkCode}</span>
              </div>

              <div className="gam-actions">
                <button className="icon-btn">
                  <Pencil size={16} />
                </button>

                <button className="icon-btn danger">
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
                  <strong>{gam.reports}</strong>
                </div>
              </div>

              <div className="gam-info-box">
                <RefreshCcw size={16} />
                <div>
                  <span>Última sincronização</span>
                  <strong>{gam.lastSync}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}