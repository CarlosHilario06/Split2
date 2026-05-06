import { useEffect, useState } from "react";

export default function EditUrlModal({ link, project, onClose, onSave }) {
  const utmKey = `utms-${project?.id}`;

  const [utms, setUtms] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [utmValues, setUtmValues] = useState({});

  useEffect(() => {
    const savedUtms = localStorage.getItem(utmKey);
    const projectUtms = savedUtms ? JSON.parse(savedUtms) : [];

    const fullUrl = link.url || "";
    const [urlOnly, queryString] = fullUrl.split("?");

    const params = new URLSearchParams(queryString || "");
    const extractedValues = {};

    projectUtms.forEach((utm) => {
      extractedValues[utm.name] = params.get(utm.name) || "";
    });

    setUtms(projectUtms);
    setBaseUrl(urlOnly);
    setUtmValues({
      ...extractedValues,
      ...(link.utms || {}),
    });
  }, [link, utmKey]);

  function handleUtmChange(name, value) {
    setUtmValues({
      ...utmValues,
      [name]: value,
    });
  }

  function buildFinalUrl() {
    const params = new URLSearchParams();

    utms.forEach((utm) => {
      const value = utmValues[utm.name];

      if (value) {
        params.set(utm.name, value);
      }
    });

    const query = params.toString();

    return query ? `${baseUrl}?${query}` : baseUrl;
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSave({
      ...link,
      url: buildFinalUrl(),
      baseUrl,
      utms: utmValues,
    });
  }

  return (
    <div className="modal-overlay">
      <form className="modal url-modal" onSubmit={handleSubmit}>
        <button type="button" className="close-button" onClick={onClose}>
          ✕
        </button>

        <h2>Editar URL</h2>

        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="URL base"
        />

        <div className="utm-fields">
          {utms.length === 0 && (
            <p style={{ color: "#888" }}>
              Nenhuma UTM cadastrada neste projeto.
            </p>
          )}

          {utms.map((utm) => (
            <div className="utm-field" key={utm.id}>
              <span>{utm.name}</span>

              <input
                placeholder={`Valor de ${utm.name}`}
                value={utmValues[utm.name] || ""}
                onChange={(e) => handleUtmChange(utm.name, e.target.value)}
              />
            </div>
          ))}
        </div>

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