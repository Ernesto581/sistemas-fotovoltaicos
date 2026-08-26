import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
import { ProjectForm } from '../components/ProjectForm'

export default function ProyectoNuevo() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link to="/proyectos" className="text-sm text-brand-600 hover:underline">
          ← Proyectos
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Nuevo proyecto</h1>
        <p className="text-sm text-slate-500">Completa los datos del sistema fotovoltaico</p>
      </div>

      <Card className="p-5">
        <ProjectForm onDone={() => navigate('/proyectos')} onCancel={() => navigate('/proyectos')} />
      </Card>
    </div>
  )
}
