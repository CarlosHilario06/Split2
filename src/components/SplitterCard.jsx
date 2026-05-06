export default function SplitterCard({ splitter, onEdit, onDelete }) {
  return (
    <div className="project-card">
      <div>
        <h2>{splitter.category}</h2>
        <p>{splitter.location}</p>
      </div>

      <div className="card-actions">
        <button onClick={() => onEdit(splitter)}>Editar</button>
        <button onClick={() => onDelete(splitter.id)}>Excluir</button>
      </div>
    </div>
  );
}