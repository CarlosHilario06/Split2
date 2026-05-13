import { useEffect, useState } from "react";
import "../index.css";

export default function GanhoPorVisita() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/ganho-por-visita")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.data || []);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="gpv-page">
        <h1 className="gpv-title">
          Ganho por Visita
        </h1>

        <p className="gpv-loading">
          Carregando dados...
        </p>
      </div>
    );
  }

  return (
    <div className="gpv-page">
      <h1 className="gpv-title">
        Ganho por Visita
      </h1>

      {items.length === 0 ? (
        <p className="gpv-loading">
          Nenhum dado encontrado.
        </p>
      ) : (
        <div className="gpv-table-wrapper">
          <table className="gpv-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Sessões</th>
                <th>Revenue</th>
                <th>eCPM</th>
                <th>Ganho/Visita</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.campaign}</td>

                  <td>{item.sessions}</td>

                  <td>
                    $
                    {Number(
                      item.revenue || 0
                    ).toFixed(2)}
                  </td>

                  <td>
                    $
                    {Number(
                      item.ecpm || 0
                    ).toFixed(2)}
                  </td>

                  <td
                    className={
                      item.ganhoPorVisita > 0
                        ? "gpv-positive"
                        : "gpv-negative"
                    }
                  >
                    $
                    {Number(
                      item.ganhoPorVisita || 0
                    ).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}