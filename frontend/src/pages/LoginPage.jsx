import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center flex-col items-center gap-1 mb-8">
           <h2 className="mt-2 text-center text-5xl font-black tracking-tighter text-on-surface">
             Vecinos<span className="text-primary">Red</span>
           </h2>
           <h3 className="text-center text-sm font-bold text-on-surface/50 mt-1 mb-2 tracking-widest uppercase">
             Iniciar Sesión
           </h3>
           <p className="text-center text-sm text-on-surface/70">
              ¿No tienes una cuenta? <Link to="/register" className="font-semibold text-primary hover:text-primary-dim transition-colors">Regístrate aquí</Link>
           </p>
        </div>
        
        <div className="card !p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? 'Iniciando sesión...' : 'Continuar'}
              {!loading && <LogIn className="w-5 h-5" />}
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <Link to="/" className="text-sm text-on-surface/50 hover:text-on-surface transition-colors">
               Volver a la página principal
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
