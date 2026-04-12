import { useEffect, useState } from 'react';
import api from '../services/api';
import { Bell, CheckCircle2, Circle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  function loadNotifications() {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.data || []))
      .catch(() => setError('Error de conectividad con subsistema de eventos.'));
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAllRead() {
    await api.post('/notifications/read-all');
    loadNotifications();
  }

  async function markAsRead(id) {
    await api.post(`/notifications/${id}/read`);
    loadNotifications();
  }

  return (
    <section className="space-y-12 pb-16">
      <div className="border-b border-outline-variant/15 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="label-md text-on-surface/50 mb-2">BITÁCORA DE SUCESOS</h1>
          <h2 className="display-lg flex items-center gap-4">
            <Bell className="text-primary w-12 h-12" /> Notificaciones
          </h2>
          <p className="text-on-surface/70 mt-4 max-w-xl">
            Alertas operativas y sincronización del estado de los expedientes.
          </p>
        </div>
        <button 
          className="btn btn-secondary bg-surface" 
          onClick={markAllRead}
          disabled={notifications.every(n => n.is_read)}
        >
          MARCAR TODO COMO AUDITADO
        </button>
      </div>

      {error && <div className="p-4 bg-error-container text-error font-bold label-md border border-error/20">{error}</div>}

      <div className="flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="p-12 text-center border border-outline-variant/15 text-on-surface/50 label-md">SIN CONTEXTO NUEVO REGISTRADO.</div>
        ) : (
          notifications.map((notification) => (
            <article 
              className={`data-plane flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors ${notification.is_read ? 'bg-surface opacity-70' : 'bg-surface-container-highest border-l-4 border-l-primary shadow-ambient'}`} 
              key={notification.id}
            >
              <div className="flex-1 flex gap-4">
                <div className="mt-1 shrink-0">
                  {notification.is_read ? <CheckCircle2 className="text-outline-variant" size={20} /> : <Circle className="text-primary fill-primary" size={20} />}
                </div>
                <div>
                  <div className="flex flex-wrap items-base gap-3 mb-1">
                    <strong className="font-bold tracking-tight">{notification.title}</strong>
                    {!notification.is_read && <span className="label-md text-primary">URGENTE</span>}
                  </div>
                  <p className="text-sm">{notification.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 border-outline-variant/15 pt-4 md:pt-0 w-full md:w-auto">
                <span className="font-mono text-xs text-on-surface/50">{new Date(notification.created_at).toLocaleString()}</span>
                {!notification.is_read && (
                  <button className="btn bg-surface-container hover:bg-outline-variant/50 text-xs py-1" onClick={() => markAsRead(notification.id)}>
                    AUDITAR
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
