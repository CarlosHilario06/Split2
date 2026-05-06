export default function ProjectCard({ project, onManage, onEdit, onDelete }) {
  return (
    <div className="project-card">
      <div>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
      </div>

      <div className="card-actions">
        <button onClick={() => onManage(project)}>Gerenciar</button>

        <button onClick={() => onEdit(project)}>
          Editar
        </button>

        <button onClick={() => onDelete(project.id)}>
          Excluir
        </button>
      </div>
    </div>
  );
}