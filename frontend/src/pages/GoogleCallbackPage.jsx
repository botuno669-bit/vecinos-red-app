import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { applyGoogleToken } = useAuth();
  const [error, setError] = useState('');
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      return;
    }

    applyGoogleToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setError('No se pudo completar el acceso con Google.'));
  }, [applyGoogleToken, navigate, token]);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="card form-card">
          <div className="alert error">Google no devolvió un token válido.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card form-card">
        {error ? <div className="alert error">{error}</div> : <p>Conectando tu cuenta...</p>}
      </div>
    </div>
  );
}
