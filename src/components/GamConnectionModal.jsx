import { useEffect, useState } from "react";

export default function GamConnectionModal({
  open,
  connection,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [networkCode, setNetworkCode] = useState("");
  const [reportId, setReportId] = useState("");
  const [reportType, setReportType] = useState("utm_campaign");

  useEffect(() => {
    if (connection) {
      setName(connection.name || "");
      setNetworkCode(connection.networkCode || "");
      setReportId(connection.reportId || "");
      setReportType(connection.reportType || "utm_campaign");
    } else {
      setName("");
      setNetworkCode("");
      setReportId("");
      setReportType("utm_campaign");
    }
  }, [connection, open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    onSave({
      name,
      networkCode,
      reportId,
      reportType,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="gam-modal">
        <h2>
          {connection
            ? "Editar GAM"
            : "Conectar novo GAM"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label>
            Nome da conta

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Ex: Meu gam - Projeto"
              required
            />
          </label>

          <label>
            Network Code

            <input
              value={networkCode}
              onChange={(e) =>
                setNetworkCode(e.target.value)
              }
              placeholder="Ex: 23292093160"
              required
            />
          </label>

          <label>
            Report ID

            <input
              value={reportId}
              onChange={(e) =>
                setReportId(e.target.value)
              }
              placeholder="Ex: 7460106012"
            />
          </label>

          <label>
            Tipo de relatório

            <select
              value={reportType}
              onChange={(e) =>
                setReportType(e.target.value)
              }
            >
              <option value="utm_campaign">
                UTM Campaign
              </option>

              <option value="key_value">
                Key-Value
              </option>

              <option value="ad_unit">
                Ad Unit
              </option>

              <option value="device">
                Device
              </option>
            </select>
          </label>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="connect-btn"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}