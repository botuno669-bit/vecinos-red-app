import { useEffect, useState } from 'react';
import api from '../services/api';
import { PackageOpen, Plus, FileEdit, Trash2, PauseCircle, PlayCircle, Image as ImageIcon, Briefcase, CheckCircle, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className="relative">
      <div 
        onClick={() => setOpen(!open)}
        className={`w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm transition-all duration-300 shadow-inner flex justify-between items-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-high ${open ? 'border-primary ring-4 ring-primary/10' : ''}`}
      >
        <span className={selectedOption ? "text-on-surface font-semibold" : "text-on-surface/50 font-medium"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className={`text-on-surface/50 transition-transform duration-300 ${open ? 'rotate-180 text-primary' : ''}`} />
      </div>

      <AnimatePresence>
        {open && (
           <>
             <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
             <motion.div 
               initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
               animate={{ opacity: 1, y: 0, scaleY: 1 }}
               exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
               transition={{ duration: 0.2 }}
               className="absolute z-50 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-outline-variant/50 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] overflow-hidden origin-top"
             >
               <ul className="max-h-56 overflow-y-auto styled-scrollbar py-2">
                 {options.map((opt) => (
                   <li 
                     key={opt.value}
                     onClick={() => { onChange(opt.value); setOpen(false); }}
                     className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center group ${String(value) === String(opt.value) ? 'bg-primary/10 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-high font-medium'}`}
                   >
                     {opt.label}
                     {String(value) === String(opt.value) && <Check size={16} className="text-primary" />}
                   </li>
                 ))}
               </ul>
             </motion.div>
           </>
        )}
      </AnimatePresence>
    </div>
  );
};

const initialForm = {
  name: '',
  description: '',
  category_id: '',
  condition: 'bueno',
  image: null,
  image_url: '',
};

export default function ItemsPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, id: null });

  function loadData() {
    Promise.all([api.get('/categories'), api.get('/items/mine')])
      .then(([categoriesResponse, itemsResponse]) => {
        setCategories(categoriesResponse.data.data || []);
        setItems(itemsResponse.data.data || []);
      })
      .catch(() => setError('Error al cargar la lista de objetos.'));
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm(initialForm);
    setEditingItem(null);
    setMessage('');
    setError('');
  }

  function startEdit(item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      category_id: item.category?.id || '',
      condition: item.condition,
      image: null,
      image_url: item.image_url || '',
    });
    setMessage('');
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('description', form.description);
      payload.append('category_id', form.category_id);
      payload.append('condition', form.condition);

      if (form.image) {
        payload.append('image', form.image);
      } else if (form.image_url) {
        payload.append('image_url', form.image_url);
      }

      if (editingItem) {
        payload.append('_method', 'PUT');
        await api.post(`/items/${editingItem.id}`, payload);
        setMessage('Objeto actualizado correctamente.');
      } else {
        await api.post('/items', payload);
        setMessage('Objeto publicado correctamente.');
      }

      resetForm();
      loadData();
    } catch (requestError) {
      const firstError = requestError.response?.data?.errors
        ? Object.values(requestError.response.data.errors)[0]?.[0]
        : requestError.response?.data?.message;

      setError(firstError || 'Error al guardar el objeto. Revisa los datos.');
    }
  }

  async function toggleStatus(item) {
    try {
      await api.put(`/items/${item.id}`, {
        status: item.status === 'available' ? 'unavailable' : 'available',
      });
      loadData();
    } catch(err) {
      setError(err.response?.data?.message || 'Error al cambiar estado.');
      setTimeout(() => setError(''), 5000);
    }
  }

  function deleteItem(id) {
    setDeleteConfirmModal({ isOpen: true, id });
  }

  async function confirmDeleteItem() {
    try {
      await api.delete(`/items/${deleteConfirmModal.id}`);
      setDeleteConfirmModal({ isOpen: false, id: null });
      loadData();
    } catch(err) {
      setDeleteConfirmModal({ isOpen: false, id: null });
      setError(err.response?.data?.message || 'Error al eliminar. Verifique que no esté comprometido en un préstamo cerrado.');
      setTimeout(() => setError(''), 5000);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 pb-16"
    >
      <motion.div variants={itemVariants} className="border-b border-outline-variant/50 pb-6">
        <h1 className="text-sm font-semibold text-primary tracking-wide mb-1 uppercase">Inventario Local</h1>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-on-surface">
          <PackageOpen className="text-primary w-8 h-8" /> Mis Objetos
        </h2>
        <p className="text-on-surface/70 mt-2 max-w-xl">
          Administra los objetos que tienes disponibles para prestar a tus vecinos. Todo lo que publiques aquí aparecerá en el catálogo global.
        </p>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="p-4 bg-success-container border border-success/20 text-success font-medium rounded-xl shadow-sm flex items-center gap-2">
            <CheckCircle size={18} /> {message}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0}} className="p-4 bg-error-container border border-error/20 text-error font-medium rounded-xl shadow-sm flex items-center gap-2">
            <AlertTriangle size={18} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Panel */}
        <motion.div variants={itemVariants} className="lg:w-1/3">
           <form className="card sticky top-24 bg-surface/80 backdrop-blur-md border border-outline-variant/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500" onSubmit={handleSubmit}>
             <div className="mb-6 flex gap-3 items-center border-b border-outline-variant/50 pb-4">
               <Briefcase className="text-primary w-6 h-6 shrink-0"/>
               <div>
                 <h3 className="text-xl font-bold text-on-surface">{editingItem ? 'Editar Objeto' : 'Publicar Nuevo'}</h3>
                 <p className="text-xs text-on-surface/60 mt-1">Completa los detalles descriptivos.</p>
               </div>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="label text-sm font-bold text-on-surface/70">Nombre del objeto</label>
                 <input className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner" placeholder="Ej: Taladro percutor" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
               </div>

               <div className="relative z-20">
                 <label className="label text-sm font-bold text-on-surface/70 mb-1 block">Categoría principal</label>
                 <CustomSelect 
                    value={form.category_id}
                    onChange={(val) => setForm({ ...form, category_id: val })}
                    placeholder="Seleccione la familia de objeto..."
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                 />
               </div>

               <div className="relative z-10">
                 <label className="label text-sm font-bold text-on-surface/70 mb-1 block">Descripción técnica</label>
                 <textarea className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner min-h-[100px] styled-scrollbar resize-y" placeholder="Agrega detalles como marca, tamaño, o cosas a tener en cuenta al prestarlo." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
               </div>

               <div className="relative z-[5]">
                 <label className="label text-sm font-bold text-on-surface/70 mb-1 block">Estado de conservación</label>
                 <CustomSelect 
                    value={form.condition}
                    onChange={(val) => setForm({ ...form, condition: val })}
                    placeholder="Evalúa el estado físico..."
                    options={[
                      { value: 'nuevo', label: 'Nuevo / Intacto (Clase A)' },
                      { value: 'bueno', label: 'Buen estado (Clase B)' },
                      { value: 'regular', label: 'Regular / Tiene detalles (Clase C)' },
                    ]}
                 />
               </div>
               
               <div className="pt-2">
                 <label className="label text-sm font-bold text-on-surface/70 flex items-center gap-2"><ImageIcon size={14}/> URL de Imagen</label>
                 <div className="relative mt-1">
                   <input className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner" placeholder="Pega el link de la foto aquí" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                 </div>
               </div>
             </div>

             <div className="flex flex-col gap-3 mt-8">
               <button className="btn btn-primary w-full py-3 shadow-md shadow-primary/20 hover:shadow-lg transition-all flex justify-center items-center gap-2" type="submit">
                 {editingItem ? <><FileEdit size={18}/> Guardar Cambios</> : <><Plus size={18}/> Lanzar Publicación</>}
               </button>
               {editingItem && (
                 <button className="btn btn-secondary bg-surface-container hover:bg-surface-container-high w-full py-2 border border-outline-variant/50 transition-colors" onClick={resetForm} type="button">Cancelar modo edición</button>
               )}
             </div>
           </form>
        </motion.div>

        {/* Directory Panel */}
        <motion.div variants={itemVariants} className="flex-1">
          <div className="flex justify-between items-end border-b border-outline-variant/50 pb-4 mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-on-surface"><PackageOpen size={20} className="text-primary"/> Tus publicaciones Activas</h3>
            <span className="text-xs font-bold text-primary bg-primary-container px-3 py-1 rounded-full">{items.length} {items.length === 1 ? 'OBJETO REGISTRADO' : 'OBJETOS EN SISTEMA'}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-outline-variant/50 border-dashed bg-surface-container-low flex flex-col items-center gap-4 text-on-surface/50">
                 <PackageOpen size={48} className="text-on-surface/20" />
                 No tienes objetos publicados aún. Usa el panel de la izquierda para empezar a abastecer el catálogo del conjunto.
              </div>
            ) : (
              <AnimatePresence>
                {items.map((item) => (
                  <motion.article 
                    layout 
                    initial={{opacity:0, scale:0.95}} 
                    animate={{opacity:1, scale:1}} 
                    exit={{opacity:0, scale:0.95}}
                    transition={{duration: 0.3}}
                    key={item.id} 
                    className="card !p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-surface/90 backdrop-blur-sm border-outline-variant/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex flex-1 gap-4 items-center">
                      {/* Thumbnail de la imagen */}
                      {item.image_url ? (
                         <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-outline-variant/30 hidden sm:block shadow-sm" />
                      ) : (
                         <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30 hidden sm:flex shadow-inner">
                            <PackageOpen className="w-8 h-8 text-on-surface/20" />
                         </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                           <h4 className="font-bold text-lg text-on-surface">{item.name}</h4>
                           <span className={`badge shadow-sm ${item.status === 'available' ? 'bg-primary-container text-primary border border-primary/20' : 'bg-surface-container-highest text-on-surface/50 border border-outline-variant/50'}`}>
                             {item.marketplace_status_label}
                           </span>
                        </div>
                        <p className="text-sm text-on-surface/70 mb-2 line-clamp-2 italic">"{item.description}"</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-wide text-on-surface/60 uppercase">
                           <span className="bg-surface-container-high border border-outline-variant/30 px-2 py-1 rounded-md">{item.category?.name}</span>
                           <span className="border-l border-outline-variant/50 pl-2">Estado: <strong className="text-on-surface/80">{item.condition}</strong></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-outline-variant/30 pt-4 sm:pt-0 sm:pl-4">
                      <button className="btn btn-secondary bg-surface-container hover:bg-surface-container-high !py-2 !px-4 text-xs font-bold border border-outline-variant/50 transition-colors flex justify-center items-center" onClick={() => startEdit(item)}>
                        <FileEdit size={14} className="mr-1"/> Editar
                      </button>
                      {item.status !== 'on_loan' && (
                        <button className="btn btn-secondary bg-surface-container hover:bg-surface-container-high !py-2 !px-4 text-xs font-bold border border-outline-variant/50 transition-colors flex justify-center items-center" onClick={() => toggleStatus(item)}>
                          {item.status === 'available' ? <><PauseCircle size={14} className="mr-1 text-warning"/> Ocultar</> : <><PlayCircle size={14} className="mr-1 text-success"/> Mostrar</>}
                        </button>
                      )}
                      <button className="btn !py-2 !px-4 text-xs font-bold text-error bg-error-container/30 hover:bg-error-container border border-error/20 transition-colors flex justify-center items-center" onClick={() => deleteItem(item.id)}>
                        <Trash2 size={14} className="mr-1"/> Borrar
                      </button>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BORRADO */}
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
                     <AlertTriangle className="text-error w-5 h-5"/> Confirmar Borrado
                  </h2>
                </div>
                
                <div className="p-8 text-center flex flex-col items-center">
                  <p className="text-sm text-on-surface/70 font-medium mb-8 leading-relaxed">
                     ¿Estás seguro de que deseas eliminar este objeto del sistema? <strong className="text-on-surface">Esta acción no se puede deshacer.</strong>
                  </p>
                  
                  <div className="flex gap-4 w-full">
                    <button onClick={() => setDeleteConfirmModal({ isOpen: false, id: null })} className="btn btn-secondary flex-1 shadow-sm transition-all text-sm font-bold">
                       Cancelar
                    </button>
                    <button onClick={confirmDeleteItem} className="btn bg-error hover:bg-error/90 text-white flex-1 shadow-md shadow-error/20 hover:shadow-lg transition-all text-sm font-bold flex justify-center items-center gap-2">
                       <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
