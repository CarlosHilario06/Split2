export default function AdManager() {
  const connections = [
    {
      id: 1,
      name: "GAM Principal",
      networkCode: "123456",
      status: "Conectado",
      reports: 1,
      lastSync: "há 42 min",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ad Manager</h1>
          <p>Conecte GAMs e configure relatórios automáticos.</p>
        </div>

        <button className="primary-btn">Conectar novo GAM</button>
      </div>

      <div className="gam-grid">
        {connections.map((gam) => (
          <div className="gam-card" key={gam.id}>
            <div className="gam-card-header">
              <div>
                <h3>{gam.name}</h3>
                <span>Network code: {gam.networkCode}</span>
              </div>

              <strong>{gam.status}</strong>
            </div>

            <div className="gam-card-stats">
              <div>
                <span>Relatórios</span>
                <b>{gam.reports}</b>
              </div>

              <div>
                <span>Último sync</span>
                <b>{gam.lastSync}</b>
              </div>
            </div>

            <div className="gam-card-actions">
              <button>Configurar relatório</button>
              <button>Sincronizar agora</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}