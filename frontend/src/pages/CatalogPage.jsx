import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Package, Search, CalendarPlus, Filter, X } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function CatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [requestModal, setRequestModal] = useState({ isOpen: false, item: null });
  const [requestDays, setRequestDays] = useState(7);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/items')
      .then(({ data }) => setItems(data.data || []))
      .catch(() => setError('Error al conectar con el servidor para obtener los objetos.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestLoan = (item) => {
    setRequestModal({ isOpen: true, item });
    setRequestDays(7);
  };

  const confirmRequestLoan = async () => {
    if (!requestDays || isNaN(requestDays) || requestDays < 1 || requestDays > 14) {
      setRequestModal({ ...requestModal, errorMsg: "Introduce un número de días válido (1 a 14 máximo)." });
      return;
    }
    
    try {
      await api.post(`/loans`, {
        item_id: requestModal.item.id,
        proposed_days: parseInt(requestDays)
      });
      setRequestModal({ ...requestModal, success: true, errorMsg: null });
    } catch (err) {
      setRequestModal({ ...requestModal, errorMsg: err.response?.data?.message || 'Hubo un error al procesar tu solicitud.' });
    }
  };

  // Extraer categorías únicas para los filtros
  const categories = useMemo(() => {
    const cats = items.map(item => item.category?.name).filter(Boolean);
    return ['all', ...new Set(cats)];
  }, [items]);

  // Aplicar filtros de categoría y búsqueda interactiva
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeFilter === 'all' || item.category?.name === activeFilter;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, activeFilter, searchTerm]);

  // Variantes de animación de Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <>
      <motion.section 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-16"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-outline-variant pb-6 gap-6">
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-primary tracking-wide mb-1 uppercase">Inventario Global</h1>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Catálogo de la Comunidad</h2>
          <p className="text-on-surface/70 mt-2 max-w-2xl">
            Descubre lo que los otros residentes han puesto a disposición para préstamo. Fomentamos la economía circular apoyándonos mutuamente.
          </p>
        </div>
        
        <div className="relative max-w-md w-full sm:w-80 group">
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Buscar herramientas, libros..." 
             className="w-full bg-surface-container border border-outline-variant/50 rounded-full pl-12 pr-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner"
           />
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface/40 group-focus-within:text-primary transition-colors" />
        </div>
      </div>

      {/* Riel de Filtros Avanzados */}
      {!loading && !error && items.length > 0 && (
         <div className="flex items-center gap-3 overflow-x-auto pb-2 styled-scrollbar">
            <Filter className="w-5 h-5 text-on-surface/40 shrink-0" />
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  activeFilter === cat 
                   ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105' 
                   : 'bg-surface-container border border-outline-variant/50 text-on-surface/60 hover:bg-surface-container-high'
                }`}
              >
                {cat === 'all' ? 'Todo el Catálogo' : cat}
              </button>
            ))}
         </div>
      )}

      {error && (
        <div className="p-4 bg-error-container text-error rounded-xl font-medium shadow-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center flex flex-col items-center gap-4 text-on-surface/50">
          <Package className="w-12 h-12 animate-pulse text-primary/50" />
          <p className="font-medium animate-pulse">Cargando el inventario disponible...</p>
        </div>
      ) : (
        <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="show"
           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const isMine = item.owner?.id === user?.id;
              return (
                <motion.div 
                  layout
                  variants={cardVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  key={item.id} 
                  className="card !p-0 overflow-hidden group bg-surface/80 backdrop-blur-md border border-outline-variant/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative"
                >
                  {/* Etiqueta flotante de Mi Objeto (Encima de la imagen si hay) */}
                  {isMine && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest text-primary uppercase shadow-md z-10">
                      Tu Objeto
                    </div>
                  )}

                  {/* Renderizado de Imagen */}
                  {item.image_url ? (
                    <div className="w-full h-48 overflow-hidden relative bg-surface-container-low">
                       <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80"></div>
                    </div>
                  ) : (
                    <div className="h-2 bg-gradient-to-r from-primary to-primary-dim opacity-20 block group-hover:opacity-100 transition-opacity duration-500"></div>
                  )}

                  <div className="p-6 flex flex-col flex-1 relative z-10">

                    <div className="flex justify-between items-start mb-4 gap-4 mt-2">
                      <h3 className="font-bold text-xl leading-tight line-clamp-2 text-on-surface group-hover:text-primary transition-colors">{item.name}</h3>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                       <span className={`px-2 py-0.5 rounded-md border text-xs font-semibold ${item.status === 'available' ? 'bg-success-container/70 border-success/20 text-success' : 'bg-surface-container border-outline-variant/50 text-on-surface/50'}`}>
                         {item.marketplace_status_label}
                       </span>
                       {item.category && (
                         <span className="px-2 py-0.5 rounded-md border border-outline-variant/50 text-xs font-medium bg-surface-container-high text-on-surface/70">
                           {item.category.name}
                         </span>
                       )}
                    </div>

                    <p className="text-sm text-on-surface/60 mb-6 flex-1 line-clamp-3 leading-relaxed italic">"{item.description}"</p>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/30 mt-auto mb-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-container to-surface-container-high border border-outline-variant/30 text-on-surface flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                        {item.owner?.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface/40">Propietario</span>
                        <span className="text-sm font-semibold truncate text-on-surface/80">{item.owner?.name} {item.owner?.apartment ? `(${item.owner.apartment})` : ''}</span>
                      </div>
                    </div>

                    {!isMine && item.status === 'available' ? (
                       <button 
                         onClick={() => handleRequestLoan(item)}
                         className="btn btn-primary w-full flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg transition-all"
                       >
                         <CalendarPlus className="w-4 h-4"/> Solicitar Préstamo
                       </button>
                    ) : (
                       <button disabled className="btn btn-secondary w-full opacity-50 cursor-not-allowed bg-surface-container border-none text-on-surface/40 flex justify-center items-center">
                         {isMine ? 'No puedes prestarte a ti mismo' : 'No disponible actualmente'}
                       </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="col-span-full text-center py-24 p-8 bg-surface-container-low/50 backdrop-blur-sm rounded-3xl border border-outline-variant/50 shadow-sm max-w-xl mx-auto mt-8"
             >
                <Package className="w-20 h-20 mx-auto text-on-surface/20 mb-6 drop-shadow-sm"/>
                <p className="font-bold text-2xl text-on-surface tracking-tight">No se encontraron objetos</p>
                <p className="text-on-surface/60 mt-3 text-lg">Intenta con otra búsqueda o selecciona una categoría diferente.</p>
             </motion.div>
          )}
        </motion.div>
      )}

    </motion.section>

      {/* Modal Glassmorphic de Solicitud de Préstamo - OUTSIDE Transform Wrapper */}
      <AnimatePresence>
        {requestModal.isOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 bg-surface/60 backdrop-blur-md"
           >
             <motion.div 
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="bg-surface rounded-3xl flex flex-col w-full max-w-md shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     {requestModal.errorMsg ? <span className="text-error flex items-center gap-2"><X className="w-5 h-5"/> Error</span> : <><CalendarPlus className="text-primary w-5 h-5"/> Acordar Plazo</>}
                  </h2>
                  <button 
                    className="btn btn-secondary !py-1.5 !px-2 text-on-surface/50 hover:text-on-surface hover:bg-surface-container bg-transparent border-none transition-colors" 
                    onClick={() => setRequestModal({ isOpen: false, item: null, errorMsg: null, success: false })}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="p-6">
                  {requestModal.errorMsg ? (
                    <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="text-center py-6">
                      <div className="w-16 h-16 mx-auto bg-error-container text-error rounded-full flex items-center justify-center mb-4 shadow-inner border border-error/20">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-on-surface mb-2">¡Ups! Operación Bloqueada</h3>
                      <p className="text-on-surface/60 font-medium mb-8 text-sm">{requestModal.errorMsg}</p>
                      <button onClick={() => setRequestModal({ isOpen: false, item: null, success: false, errorMsg: null })} className="btn btn-secondary w-full transition-all text-error shadow-sm font-bold border border-error/30 hover:bg-error-container">Cerrar y Volver al Catálogo</button>
                    </motion.div>
                  ) : requestModal.success ? (
                    <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} className="text-center py-6">
                      <div className="w-16 h-16 mx-auto bg-success-container text-success rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-on-surface mb-2">¡Solicitud Enviada!</h3>
                      <p className="text-on-surface/60 font-medium">{requestModal.item?.owner?.name?.split(' ')[0]} ha recibido tu petición para este objeto. Podrás hacer seguimiento en tu bitácora.</p>
                      <button onClick={() => setRequestModal({ isOpen: false, item: null, success: false })} className="btn btn-secondary mt-6 w-full">Cerrar</button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex gap-4">
                         <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold shrink-0 shadow-inner">
                            {requestModal.item?.owner?.name?.[0]?.toUpperCase()}
                         </div>
                         <div>
                            <p className="text-sm text-on-surface/50 font-bold mb-0.5">Vas a solicitar:</p>
                            <p className="text-on-surface font-bold text-lg leading-tight">{requestModal.item?.name}</p>
                         </div>
                      </div>
                      
                      <div className="mb-8">
                        <label className="label text-sm font-bold text-on-surface/70 block mb-2">¿Por cuántos días lo necesitas? (Máximo 14)</label>
                        <input 
                          type="number"
                          min="1"
                          max="14"
                          className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-4 text-2xl text-primary font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner text-center"
                          value={requestDays}
                          onChange={(e) => setRequestDays(e.target.value)}
                        />
                      </div>
                      
                      <button onClick={confirmRequestLoan} className="btn btn-primary w-full py-4 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-base font-bold flex justify-center items-center gap-2">
                         <CalendarPlus size={20} /> Enviar Solicitud a {requestModal.item?.owner?.name?.split(' ')[0]}
                      </button>
                    </>
                  )}
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
