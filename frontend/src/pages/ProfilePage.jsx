import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { User, Activity, Star, Info, Settings, Save, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lenderRatings = ratings?.as_lender?.ratings?.data || ratings?.as_lender?.ratings || [];
  const borrowerRatings = ratings?.as_borrower?.ratings?.data || ratings?.as_borrower?.ratings || [];

  useEffect(() => {
    if (!user) return;
    api.get(`/users/${user.id}/ratings`).then(({ data }) => setRatings(data));
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = form ?? {
      name: user?.name || '',
      apartment: user?.apartment || '',
      phone: user?.phone || '',
    };
    try {
      const { data } = await api.put('/auth/profile', payload);
      setUser(data.user);
      setMessage('Perfil actualizado correctamente.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Falló la actualización.');
      setTimeout(() => setError(''), 5000);
    }
  }

  const currentForm = form ?? {
    name: user?.name || '',
    apartment: user?.apartment || '',
    phone: user?.phone || '',
  };

  function updateField(key, value) {
    setForm({
      ...currentForm,
      [key]: value,
    });
  }

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
      <motion.div variants={itemVariants} className="border-b border-outline-variant pb-6">
        <h1 className="text-sm font-semibold text-primary tracking-wide mb-1 uppercase">Ajustes Personales</h1>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="text-primary w-8 h-8" /> Mi Perfil
        </h2>
        <p className="text-on-surface/70 mt-2 max-w-xl">
          Actualiza tus datos de contacto y revisa las calificaciones que te han dejado otros vecinos.
        </p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 bg-success-container border border-success/20 text-success rounded-xl font-medium shadow-sm flex items-center gap-2">
            <Save size={18}/> {message}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-4 bg-error-container border border-error/20 text-error rounded-xl font-medium shadow-sm flex items-center gap-2">
            <AlertTriangle size={18}/> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <motion.form variants={itemVariants} className="card space-y-6 bg-surface/80 backdrop-blur-md border border-outline-variant/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500" onSubmit={handleSubmit}>
          <div className="mb-4 border-b border-outline-variant/50 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2"><Settings size={20} className="text-primary"/> Datos Personales</h3>
          </div>

          <div>
            <label className="label text-sm font-bold text-on-surface/70">Nombre completo</label>
            <input 
              className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner" 
              value={currentForm.name} 
              onChange={(event) => updateField('name', event.target.value)} 
            />
          </div>
          <div>
            <label className="label text-sm font-bold text-on-surface/70">Unidad / Apartamento</label>
            <input 
              className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner" 
              value={currentForm.apartment} 
              onChange={(event) => updateField('apartment', event.target.value)} 
            />
          </div>
          <div>
            <label className="label text-sm font-bold text-on-surface/70">Teléfono de contacto</label>
            <input 
              className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner" 
              value={currentForm.phone} 
              onChange={(event) => updateField('phone', event.target.value)} 
            />
          </div>
          <div className="pt-4">
            <button className="btn btn-primary w-full shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2" type="submit">
              <Save size={18}/> Guardar Cambios
            </button>
          </div>
        </motion.form>

        {ratings && (
           <motion.div variants={itemVariants} className="space-y-6">
             <article className="card relative overflow-hidden bg-surface/80 backdrop-blur-md border border-outline-variant/40 hover:shadow-xl transition-all duration-500">
                <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] pointer-events-none transform rotate-12">
                   <Star className="w-64 h-64 text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6 border-b border-outline-variant/50 pb-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface"><Activity className="text-primary w-5 h-5"/> Como Prestamista</h2>
                      <p className="text-xs text-on-surface/50 mt-1">Tu reputación prestando objetos a otros.</p>
                    </div>
                    <div className="text-right bg-primary-container px-4 py-2 rounded-xl">
                       <div className="text-3xl font-black text-primary">{ratings.as_lender.average.toFixed(1)}</div>
                       <div className="text-[10px] text-primary/60 font-bold tracking-widest mt-0.5">SOBRE 5.0</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 styled-scrollbar">
                    {lenderRatings.length === 0 ? <p className="text-on-surface/50 text-sm text-center py-4">Aún no tienes calificaciones prestando objetos.</p> : lenderRatings.map((rating) => (
                      <div key={rating.id} className="p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl flex gap-4 hover:border-primary/30 transition-colors">
                        <strong className="text-primary bg-primary-container px-3 py-1 rounded-lg shrink-0 h-fit font-bold shadow-sm">{rating.score}.0</strong>
                        <span className="text-sm text-on-surface/80 mt-1 italic">"{rating.comment || 'Sin comentario adicional.'}"</span>
                      </div>
                    ))}
                  </div>
                </div>
             </article>

             <article className="card relative overflow-hidden bg-surface/80 backdrop-blur-md border border-outline-variant/40 border-t-[6px] border-t-warning hover:shadow-xl transition-all duration-500">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6 border-b border-outline-variant/50 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-on-surface">Como Prestatario</h2>
                        <p className="text-xs text-on-surface/50 mt-1">Cómo te comportas pidiendo prestado.</p>
                    </div>
                    <div className="text-right bg-warning-container px-4 py-2 rounded-xl">
                       <div className={`text-3xl font-black ${ratings.total_incidents > 0 ? 'text-error' : 'text-warning'}`}>{ratings.as_borrower.average.toFixed(1)}</div>
                       <div className="text-[10px] text-warning/60 font-bold tracking-widest mt-0.5">SOBRE 5.0</div>
                    </div>
                  </div>
                  
                  {ratings.total_incidents > 0 && (
                     <div className="mb-4 p-3 bg-error-container border border-error/20 text-error rounded-xl flex gap-2 items-center text-sm shadow-sm">
                        <Info className="w-5 h-5 shrink-0"/>
                        <p><strong>Atención:</strong> Tienes {ratings.total_incidents} incidentes (demoras o disputas).</p>
                     </div>
                  )}

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 styled-scrollbar">
                    {borrowerRatings.length === 0 ? <p className="text-on-surface/50 text-sm text-center py-4">Aún no has solicitado objetos prestados.</p> : borrowerRatings.map((rating) => (
                      <div key={rating.id} className="p-4 bg-surface-container-low border border-outline-variant/50 rounded-xl flex gap-4 hover:border-warning/40 transition-colors">
                        <strong className="text-warning bg-warning-container px-3 py-1 rounded-lg shrink-0 h-fit font-bold shadow-sm">{rating.score}.0</strong>
                        <span className="text-sm text-on-surface/80 mt-1 italic">"{rating.comment || 'Sin comentario adicional.'}"</span>
                      </div>
                    ))}
                  </div>
                </div>
             </article>
           </motion.div>
        )}
      </div>
    </motion.section>
  );
}
