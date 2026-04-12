import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { Package, Activity, Bell, Star, Home, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const preview = data?.marketplace_preview?.data || data?.marketplace_preview || [];

  useEffect(() => {
    api.get('/dashboard')
      .then((response) => setData(response.data))
      .catch(() => setError('Error al cargar la información. Por favor, recarga la página.'));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 pb-16"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-6 gap-6 relative">
        <div className="absolute top-0 right-0 -m-32 w-64 h-64 bg-primary opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex-1">
          <h1 className="text-sm font-semibold text-primary tracking-wide mb-1 uppercase">Centro de Control</h1>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface">¡Hola, {user?.name?.split(' ')[0] || 'Vecino'}!</h2>
          <p className="text-on-surface/70 mt-2 max-w-xl">Aquí tienes un resumen de tu actividad comunitaria y el estado del condominio.</p>
        </div>
        
        <div className="flex gap-4 sm:gap-6 text-right relative z-10 shrink-0">
           <div className="bg-surface/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-center">
             <div className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest mb-1 flex justify-end items-center gap-1"><Star size={12} className="text-primary"/> Reputación</div>
             <div className="text-2xl font-bold text-on-surface">--<span className="text-sm text-on-surface/40 font-medium">/5.0</span></div>
           </div>
           <div className="bg-surface/50 backdrop-blur-sm px-4 py-3 rounded-xl border border-outline-variant/50 shadow-sm flex flex-col justify-center">
             <div className="text-[10px] font-bold text-on-surface/50 uppercase tracking-widest mb-1 flex justify-end items-center gap-1"><Home size={12} className="text-primary"/> Unidad</div>
             <div className="text-2xl font-bold text-on-surface">{user?.apartment || 'N/A'}</div>
           </div>
        </div>
      </motion.div>

      {error && <motion.div variants={itemVariants} className="p-4 bg-error-container text-error rounded-xl shadow-sm text-sm flex items-center font-bold border border-error/20">{error}</motion.div>}

      {data ? (
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-8">
            <motion.div variants={itemVariants}>
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xl font-bold text-on-surface flex items-center gap-2"><Activity className="text-primary"/> Tus Actividades</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="card bg-surface/60 backdrop-blur-md border border-outline-variant/50 flex items-center gap-4 !p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="p-3 bg-primary-container/50 text-primary rounded-xl shadow-inner border border-primary/10">
                       <Clock className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="text-3xl font-bold text-on-surface leading-tight">{data.summary.active_loans_count}</div>
                       <div className="text-[11px] font-bold text-on-surface/50 uppercase tracking-widest mt-0.5">Préstamos Activos</div>
                    </div>
                  </div>
                  
                  <div className="card bg-surface/60 backdrop-blur-md border border-outline-variant/50 flex items-center gap-4 !p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="p-3 bg-warning-container/50 text-warning rounded-xl shadow-inner border border-warning/10">
                       <Bell className="w-6 h-6" />
                    </div>
                    <div>
                       <div className="text-3xl font-bold text-on-surface leading-tight">{data.summary.unread_notifications_count}</div>
                       <div className="text-[11px] font-bold text-on-surface/50 uppercase tracking-widest mt-0.5">Notificaciones</div>
                    </div>
                  </div>
               </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-outline-variant/30">
                <h3 className="text-xl font-bold flex items-center gap-2"><Package className="text-primary"/> Catálogo Reciente</h3>
                <Link to="/catalog" className="text-sm font-bold text-primary hover:text-primary-dim transition-colors flex items-center gap-1 bg-surface-container py-1.5 px-3 rounded-full">Explorar todo <ArrowRight size={14}/></Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {preview.slice(0, 3).map((item) => (
                  <div key={item.id} className="card !p-0 overflow-hidden flex flex-col bg-surface/60 border border-outline-variant/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group">
                    <div className="h-1 bg-gradient-to-r from-primary/30 to-primary-dim opacity-40 group-hover:opacity-100 transition-opacity"></div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-[10px] font-bold text-primary mb-1 uppercase tracking-widest bg-primary-container/20 w-max px-2 py-0.5 rounded-md border border-primary/10">{item.category?.name || 'Objeto'}</div>
                      <h4 className="font-bold text-base mb-1.5 leading-tight text-on-surface">{item.name}</h4>
                      <p className="text-[12px] font-medium text-on-surface/60 mb-5 flex-1 italic truncate">Aportado por {item.owner?.name}</p>
                      
                      <Link to="/catalog" className="btn btn-secondary w-full bg-surface-container hover:bg-surface-container-high transition-colors text-[11px] py-1.5 shadow-sm font-bold">VER EN CATÁLOGO</Link>
                    </div>
                  </div>
                ))}
                {preview.length === 0 && (
                   <div className="col-span-full py-12 text-center border border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest text-on-surface/40 text-sm font-medium">
                     Ningún vecino ha subido objetos aún. ¡Sé el primero!
                   </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.aside variants={itemVariants} className="lg:w-80 flex flex-col gap-5">
             <div className="card text-center !p-6 bg-surface/60 backdrop-blur-md border border-outline-variant/50 hover:shadow-lg transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary-container/50 to-surface-container-high flex items-center justify-center rounded-2xl mb-4 shadow-inner border border-primary/10">
                 <Package className="text-primary w-6 h-6" />
               </div>
               <div className="text-4xl font-bold text-on-surface mb-0.5 drop-shadow-sm">{data.summary.items_count}</div>
               <div className="text-[11px] font-bold text-on-surface/50 mb-6 uppercase tracking-widest">Tus Contribuciones</div>
               <Link to="/my-items" className="btn btn-primary w-full py-2 shadow-sm hover:shadow-md transition-all font-bold text-sm">Mis Publicaciones</Link>
             </div>

             <div className="card bg-primary-container/30 border border-primary/20 !p-5 shadow-sm">
               <h4 className="font-bold mb-2 text-primary flex items-center gap-2 text-sm"><ShieldCheck size={18}/> Préstamos Seguros</h4>
               <p className="text-xs text-on-surface/70 leading-relaxed mb-4 font-medium">
                 Para proteger tu reputación en la comunidad, aprueba y recibe objetos utilizando el código de seguridad (PIN) generado aquí en la plataforma.
               </p>
               <Link to="/loans" className="btn btn-secondary bg-surface hover:bg-surface-container/80 text-[11px] w-full py-1.5 shadow-sm font-bold border border-outline-variant/50">Ir a mi bitácora</Link>
             </div>
          </motion.aside>
          
        </div>
      ) : (
        <div className="py-32 text-center text-on-surface/50 font-bold flex flex-col items-center justify-center gap-4">
           <Activity className="w-12 h-12 animate-bounce text-primary/40" />
           Cargando el Centro de Mando...
        </div>
      )}
    </motion.section>
  );
}
