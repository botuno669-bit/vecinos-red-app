import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../services/api';
import { ShieldAlert, Users, Database, Activity, CheckCircle, Clock, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, user: null });

  function loadAdmin() {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/users')])
      .then(([dashboardResponse, usersResponse]) => {
        setDashboard(dashboardResponse.data);
        setUsers(usersResponse.data.data || []);
      })
      .catch(() => setError('ACCESO A CONSOLA DE MANDO INTERRUMPIDO.'));
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdmin();
    }
  }, [user]);

  async function toggleUser(id) {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      loadAdmin();
    } catch (err) {
      setError(err.response?.data?.message || 'Error de red al intentar conmutar el usuario.');
      setTimeout(() => setError(''), 5000);
    }
  }

  function confirmDelete(user) {
    setDeleteConfirmModal({ isOpen: true, user });
  }

  async function executeDelete() {
    try {
      await api.delete(`/admin/users/${deleteConfirmModal.user.id}`);
      setDeleteConfirmModal({ isOpen: false, user: null });
      loadAdmin();
    } catch (err) {
      setDeleteConfirmModal({ isOpen: false, user: null });
      setError(err.response?.data?.message || err.response?.data?.error || 'No se puede eliminar el usuario porque tiene trazabilidad bloqueante en la base de datos.');
      setTimeout(() => setError(''), 7000);
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center border-t-4 border-t-error bg-error-container text-error">
         <ShieldAlert className="w-16 h-16 mb-6" />
         <h1 className="headline-sm">ACCESO RESTRINGIDO</h1>
         <p className="label-md mt-4">Autorización insuficiente para visualizar este cuadrante.</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <motion.section 
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="space-y-12 pb-16"
      >
        <motion.div variants={itemVariants} className="border-b border-outline-variant/30 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-sm font-semibold text-error tracking-wide mb-1 uppercase">Control Central</h1>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-error w-8 h-8" /> Panel de Administración
          </h2>
          <p className="text-on-surface/70 mt-2 max-w-xl">
            Centro de monitoreo de métricas globales y administración del acceso de los residentes a la plataforma comunitaria.
          </p>
        </div>
        <div className="text-xs px-4 py-2 bg-error-container text-error rounded-full font-bold tracking-widest uppercase flex items-center gap-2 border border-error/20 shadow-sm">
           <Database size={14} /> Base de Datos Conectada
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-error-container text-error font-bold text-sm border border-error/20 rounded-xl flex items-center gap-2 shadow-sm">
           <ShieldAlert size={18} /> {error}
        </motion.div>
      )}

      {dashboard && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-primary hover:-translate-y-1 transition-transform shadow-md hover:shadow-primary/10">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-on-surface">{dashboard.summary.total_users}</div>
               <Users className="text-primary/50 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mt-1">Usuarios Registrados</div>
          </div>
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-primary hover:-translate-y-1 transition-transform shadow-md hover:shadow-primary/10">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-on-surface">{dashboard.summary.total_items}</div>
               <Package className="text-primary/50 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mt-1">Objetos en Sistema</div>
          </div>
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-error hover:-translate-y-1 transition-transform shadow-md hover:shadow-error/10">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-error">{dashboard.summary.active_loans}</div>
               <Activity className="text-error/50 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-error/70 uppercase tracking-widest mt-1">Préstamos Activos</div>
          </div>
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-warning hover:-translate-y-1 transition-transform shadow-md hover:shadow-warning/10">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-warning">{dashboard.summary.pending_approvals}</div>
               <Clock className="text-warning/50 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mt-1">Peticiones Nuevas</div>
          </div>
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-outline-variant hover:-translate-y-1 transition-transform shadow-md">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-on-surface/80">{dashboard.summary.pending_handovers}</div>
               <Package className="text-on-surface/30 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mt-1">En Tránsito</div>
          </div>
          <div className="card !p-5 bg-surface/80 backdrop-blur-sm border-t-4 border-t-success hover:-translate-y-1 transition-transform shadow-md hover:shadow-success/10">
             <div className="flex justify-between items-start mb-2">
               <div className="text-3xl font-black text-success">{dashboard.summary.completed_loans}</div>
               <CheckCircle className="text-success/50 w-6 h-6" />
             </div>
             <div className="text-xs font-bold text-on-surface/50 uppercase tracking-widest mt-1">Préstamos Finalizados</div>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="card bg-surface/80 backdrop-blur-md border border-outline-variant/40 shadow-xl overflow-hidden !p-0">
        <div className="flex items-center gap-3 p-6 border-b border-outline-variant/30 bg-surface-container-lowest">
           <Users className="text-primary w-6 h-6" />
           <h3 className="text-xl font-bold text-on-surface">Base de Vecinos y Moderación</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 uppercase text-[11px] text-on-surface/50 bg-surface-container-low font-bold">
                <th className="px-6 py-4 tracking-widest">Información del Usuario</th>
                <th className="px-6 py-4 tracking-widest">Correo Electrónico</th>
                <th className="px-6 py-4 tracking-widest">Apartamento</th>
                <th className="px-6 py-4 tracking-widest">Estado de Cuenta</th>
                <th className="px-6 py-4 tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 font-sans text-sm">
              <AnimatePresence>
                {users.map((row) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    key={row.id} 
                    className="hover:bg-surface-container-lowest transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-surface-container-high flex items-center justify-center font-bold text-xs text-primary shadow-inner shrink-0">
                            {row.name.charAt(0).toUpperCase()}
                         </div>
                         <span className="font-bold text-on-surface">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface/70 font-medium">{row.email}</td>
                    <td className="px-6 py-4 text-on-surface/60 font-semibold">{row.apartment || '--'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold rounded-md border ${row.is_active ? 'bg-success-container/50 text-success border-success/20' : 'bg-error-container/50 text-error border-error/20'}`}>
                        {row.is_active ? 'HABILITADO' : 'SUSPENDIDO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.role !== 'admin' && (
                        <div className="flex justify-end gap-2">
                           <button 
                             className="btn btn-secondary bg-surface-container hover:bg-surface-container-high py-1.5 px-3 text-[11px] border border-outline-variant/50 transition-all font-bold" 
                             onClick={() => toggleUser(row.id)}
                           >
                             {row.is_active ? 'Suspender Acceso' : 'Reactivar'}
                           </button>
                           <button 
                             className="btn !py-1.5 !px-3 text-[11px] font-bold text-error bg-error-container/30 hover:bg-error-container border border-error/20 transition-colors" 
                             onClick={() => confirmDelete(row)}
                           >
                             Eliminar
                           </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
      </motion.section>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO DE USUARIO */}
      <AnimatePresence>
        {deleteConfirmModal.isOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-surface/80 backdrop-blur-md"
           >
             <motion.div 
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="bg-surface rounded-3xl flex flex-col w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <ShieldAlert className="text-error w-5 h-5"/> Purgar Vecino
                  </h2>
                </div>
                
                <div className="p-8 text-center flex flex-col items-center">
                  <p className="text-sm text-on-surface/70 font-medium mb-8 leading-relaxed">
                     ¿Estás seguro de que deseas eliminar a <strong className="text-on-surface">{deleteConfirmModal.user?.name}</strong> del sistema? <strong className="text-error">Esta acción no se puede deshacer.</strong>
                  </p>
                  
                  <div className="flex gap-4 w-full">
                    <button onClick={() => setDeleteConfirmModal({ isOpen: false, user: null })} className="btn btn-secondary flex-1 shadow-sm transition-all text-sm font-bold">
                       Cancelar
                    </button>
                    <button onClick={executeDelete} className="btn bg-error hover:bg-error/90 text-white flex-1 shadow-md shadow-error/20 hover:shadow-lg transition-all text-sm font-bold flex justify-center items-center gap-2">
                       Aceptar y Purgar
                    </button>
                  </div>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
