import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import { UserPlus, AlertCircle, Share2 } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    apartment: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const resp = await register(formData);
      setSuccess(resp.message || 'Cuenta creada correctamente y pendiente de validación.');
      setFormData({ name: '', email: '', password: '', password_confirmation: '', apartment: '' });
    } catch (err) {
      if (err.response) {
         const emailError = err.response?.data?.errors?.email?.[0];
         const passwordError = err.response?.data?.errors?.password?.[0];
         setError(emailError || passwordError || err.response?.data?.message || 'Error del servidor en el registro.');
      } else {
         setError('Error de aplicación. Intenta de nuevo.');
         console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 -m-32 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center flex-col items-center gap-1 mb-8">
           <h2 className="mt-2 text-center text-5xl font-black tracking-tighter text-on-surface">
             Vecinos<span className="text-primary">Red</span>
           </h2>
           <h3 className="text-center text-sm font-bold text-on-surface/50 mt-1 mb-2 tracking-widest uppercase">
             Crear Cuenta
           </h3>
           <p className="text-center text-sm text-on-surface/70">
              ¿Ya tienes una cuenta? <Link to="/login" className="font-semibold text-primary hover:text-primary-dim transition-colors">Inicia sesión aquí</Link>
           </p>
        </div>
        
        <div className="card !p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {success && (
              <div className="bg-success-container text-success px-4 py-4 rounded-xl text-sm font-medium flex flex-col gap-2 shadow-sm border border-success/20">
                <span className="font-bold flex items-center gap-2"><UserPlus size={18}/> ¡Registro Exitoso!</span>
                {success}
              </div>
            )}
            {error && (
              <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="name">Nombre completo</label>
              <input
                id="name"
                type="text"
                required
                className="input"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="label" htmlFor="apartment">Nº Apartamento</label>
                <input
                  id="apartment"
                  type="text"
                  className="input"
                  placeholder="Ej: 402B"
                  value={formData.apartment}
                  onChange={handleChange}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label" htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label" htmlFor="password_confirmation">Confirmar contraseña</label>
              <input
                id="password_confirmation"
                type="password"
                required
                className="input"
                placeholder="Mínimo 8 caracteres"
                value={formData.password_confirmation}
                onChange={handleChange}
              />
            </div>

            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base mt-2"
              >
                {loading ? 'Enviando solicitud...' : 'Registrarse'}
                {!loading && <UserPlus className="w-5 h-5" />}
              </button>
            )}
          </form>
          
          <div className="mt-6 text-center">
             <Link to="/" className="text-sm text-on-surface/50 hover:text-on-surface transition-colors">
               Volver a la página principal
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
