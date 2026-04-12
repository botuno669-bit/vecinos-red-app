import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { ArrowLeftRight, Clock, CheckCircle, AlertTriangle, MessageSquare, ShieldCheck, FileText, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoansPage() {
  const { user } = useAuth();
  const [borrowedLoans, setBorrowedLoans] = useState([]);
  const [lentLoans, setLentLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [negotiateModal, setNegotiateModal] = useState({ isOpen: false, loan: null, days: 7, messageText: '' });
  const [approveModal, setApproveModal] = useState({ isOpen: false, loan: null, days: 7 });
  const [displayCodeModal, setDisplayCodeModal] = useState({ isOpen: false, code: '', title: '', message: '' });
  const [inputCodeModal, setInputCodeModal] = useState({ isOpen: false, loan: null, actionType: '', title: '', message: '', code: '', errorMsg: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', confirmAction: null });
  const [ratingModal, setRatingModal] = useState({ isOpen: false, loan: null, score: 5, comment: '' });

  function loadLoans() {
    Promise.all([api.get('/loans/borrowed'), api.get('/loans/lent')])
      .then(([borrowedResponse, lentResponse]) => {
        setBorrowedLoans(borrowedResponse.data.data || []);
        setLentLoans(lentResponse.data.data || []);
      })
      .catch(() => setError('Error de conexión al cargar los préstamos.'));
  }

  useEffect(() => {
    loadLoans();
  }, []);

  const handleAction = async (actionFn, successMsg) => {
    try {
      setError('');
      setMessage('');
      await actionFn();
      if (successMsg) setMessage(successMsg);
      setTimeout(() => setMessage(''), 5000);
      loadLoans();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'No se pudo procesar la solicitud (Fallo de servidor).';
      setError(errMsg);
      setTimeout(() => setError(''), 7000);
    }
  };

  async function openDetail(loanId) {
    try {
      const { data } = await api.get(`/loans/${loanId}`);
      setSelectedLoan(data.data);
    } catch (err) {
      setError('Error al obtener los detalles completos del préstamo.');
      setTimeout(() => setError(''), 5000);
    }
  }

  function openApproveModal(loan) {
    setApproveModal({ isOpen: true, loan, days: loan.proposed_days || 7 });
  }

  function confirmApproval() {
    if (!approveModal.days || isNaN(approveModal.days) || approveModal.days < 1 || approveModal.days > 14) {
      setError("Introduce un número de días válido (1 a 14 máximo).");
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    handleAction(
      () => api.post(`/loans/${approveModal.loan.id}/approve`, { agreed_days: Number(approveModal.days) }),
      'Préstamo aprobado de forma exitosa.'
    ).then(() => {
        setApproveModal({ isOpen: false, loan: null, days: 7 });
        if (selectedLoan) openDetail(approveModal.loan.id); 
    });
  }

  function openNegotiateModal(loan) {
    setNegotiateModal({ isOpen: true, loan, days: loan.proposed_days || 7, messageText: '' });
  }

  function confirmNegotiation() {
    if (!negotiateModal.days || isNaN(negotiateModal.days) || negotiateModal.days < 1 || negotiateModal.days > 14) {
      setError("Introduce un número de días válido (1 a 14 máximo).");
      setTimeout(() => setError(''), 5000);
      return;
    }

    handleAction(
      () => api.post(`/loans/${negotiateModal.loan.id}/counter-offer`, { proposed_days: Number(negotiateModal.days), message: negotiateModal.messageText }),
      'Has enviado tu nueva propuesta.'
    ).then(() => { 
      setNegotiateModal({ isOpen: false, loan: null, days: 7, messageText: '' });
      if (selectedLoan) openDetail(negotiateModal.loan.id); 
    });
  }

  function cancelLoan(loan) {
    setConfirmModal({
      isOpen: true,
      message: '¿Estás seguro de cancelar esta solicitud? Esta acción no se puede deshacer.',
      confirmAction: () => {
        handleAction(
          () => api.post(`/loans/${loan.id}/cancel`, { reason: 'Cancelado por el usuario.' }),
          'El préstamo ha sido cancelado.'
        );
      }
    });
  }

  function deleteLoanHistory(loan) {
    setConfirmModal({
      isOpen: true,
      message: '¿Deseas eliminar este registro de tu historial? Esto no afectará la reputación ni las métricas ya consolidadas.',
      confirmAction: () => {
        handleAction(
          () => api.delete(`/loans/${loan.id}`),
          'El registro del préstamo ha sido eliminado.'
        );
      }
    });
  }

  function openInputCodeModal(loan, actionType) {
    const isHandover = actionType === 'handover';
    setInputCodeModal({
      isOpen: true,
      loan,
      actionType,
      title: isHandover ? 'Confirmar Recepción' : 'Confirmar Devolución',
      message: isHandover 
        ? 'Ingresa el código de 6 dígitos que el dueño del objeto te debe proporcionar ahora mismo para formalizar la entrega en el sistema.' 
        : 'Ingresa el código de 6 dígitos que el vecino prestatario te dictará para asegurar que el objeto volvió a tus manos.',
      code: '',
      errorMsg: ''
    });
  }

  async function submitInputCode() {
    if (!inputCodeModal.code || inputCodeModal.code.length < 6) {
       setInputCodeModal(prev => ({ ...prev, errorMsg: "Ingresa un código válido de 6 dígitos." }));
       return;
    }
    const endpoint = inputCodeModal.actionType === 'handover' ? 'confirm-handover' : 'confirm-return';
    const successMsg = inputCodeModal.actionType === 'handover' ? '¡Entrega confirmada! Cuida mucho el objeto.' : 'Objeto devuelto existosamente. ¡Gracias por usar la plataforma!';

    try {
      await api.post(`/loans/${inputCodeModal.loan.id}/${endpoint}`, { code: inputCodeModal.code });
      setMessage(successMsg);
      setTimeout(() => setMessage(''), 5000);
      loadLoans();
      setInputCodeModal({ isOpen: false, loan: null, actionType: '', title: '', message: '', code: '', errorMsg: '' });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Código incorrecto o inválido.';
      setInputCodeModal(prev => ({ ...prev, errorMsg: errMsg }));
    }
  }

  async function getDeliveryCode(loan) {
    try {
      const { data } = await api.get(`/loans/${loan.id}/handover-code`);
      setDisplayCodeModal({
         isOpen: true,
         code: data.delivery_code,
         title: 'Código de Entrega',
         message: 'Díctale o muéstrale este código de seguridad a tu vecino. Él deberá ingresarlo en su plataforma para verificar y formalizar que le has entregado el objeto.'
      });
    } catch (err) {
       setError(err.response?.data?.message || 'No se pudo obtener el código de seguridad.');
       setTimeout(() => setError(''), 5000);
    }
  }

  async function initiateReturn(loan) {
    try {
      const { data } = await api.post(`/loans/${loan.id}/start-return`);
      setDisplayCodeModal({
         isOpen: true,
         code: data.return_code,
         title: 'Código de Devolución',
         message: 'Debes darle este código al dueño del objeto. Él deberá ingresarlo en su sesión para confirmar que le has entregado el objeto de vuelta.'
      });
      setMessage('Proceso de devolución iniciado.');
      loadLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al intentar iniciar la devolución.');
      setTimeout(() => setError(''), 5000);
    }
  }

  function rateLoan(loan) {
    setRatingModal({ isOpen: true, loan, score: 5, comment: '' });
  }

  function confirmRating() {
    if (ratingModal.score < 1 || ratingModal.score > 5) {
      setError("La puntuación debe estar entre 1 y 5.");
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    handleAction(
      () => api.post(`/loans/${ratingModal.loan.id}/rate`, { score: Number(ratingModal.score), comment: ratingModal.comment }),
      'Calificación enviada. ¡Construyes una mejor comunidad!'
    ).then(() => {
        setRatingModal({ isOpen: false, loan: null, score: 5, comment: '' });
    });
  }

  function acceptNegotiation(negotiationId, loanId) {
    handleAction(
      () => api.post(`/negotiations/${negotiationId}/accept`),
      'Términos aceptados.'
    ).then(() => { if (selectedLoan) openDetail(loanId); });
  }

  function downloadReceipt(loan) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Color primario Tailwind
    doc.text('Vecindad Red', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Color texto
    doc.text('Comprobante de Préstamo Circular', 105, 30, { align: 'center' });
    
    // Info
    doc.setFontSize(11);
    doc.text(`ID de Registro: #${loan.id}`, 20, 50);
    doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString()}`, 20, 58);
    doc.text(`Estado del Trámite: ${loan.workflow_label}`, 20, 66);
    
    // Generar la tabla de datos
    doc.autoTable({
      startY: 80,
      head: [['Detalle del Acuerdo', 'Información']],
      body: [
        ['Objeto Prestado', loan.item?.name || 'N/A'],
        ['Vecino Propietario', loan.item?.owner?.name || 'N/A'],
        ['Vecino Solicitante', loan.borrower?.name || 'N/A'],
        ['Categoría Base', loan.item?.category?.name || 'Inventario Comunitario'],
        ['Días Pactados', `${loan.agreed_days || loan.proposed_days} días`],
        ['Fecha de Autorización', loan.approved_at ? new Date(loan.approved_at).toLocaleDateString() : 'Pendiente'],
        ['Fecha Límite de Retorno', loan.expected_return_date ? new Date(loan.expected_return_date).toLocaleDateString() : 'Pendiente']
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], halign: 'left' },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Zona de Firmas
    const finalY = doc.lastAutoTable.finalY || 160;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Este documento es un comprobante de respaldo generado por la plataforma Vecindad Red.', 105, finalY + 20, { align: 'center' });

    doc.line(30, finalY + 50, 80, finalY + 50);
    doc.text('Firma Propietario', 55, finalY + 56, { align: 'center' });

    doc.line(130, finalY + 50, 180, finalY + 50);
    doc.text('Firma Prestatario', 155, finalY + 56, { align: 'center' });

    doc.save(`Comprobante_Prestamo_${loan.id}.pdf`);
  }

  function renderActions(loan, isOwner) {
    const actions = [];

    if (!isOwner && ['pending_owner', 'negotiating'].includes(loan.workflow_state)) {
      actions.push(<button key="counter" className="btn btn-secondary text-xs flex-1" onClick={() => openNegotiateModal(loan)}>Nueva propuesta</button>);
      actions.push(<button key="cancel" className="btn bg-error-container text-error hover:bg-error-container/80 text-xs flex-1" onClick={() => cancelLoan(loan)}>Cancelar solicitud</button>);
    }

    if (isOwner && ['pending_owner', 'negotiating'].includes(loan.workflow_state)) {
      actions.push(<button key="approve" className="btn btn-primary text-xs flex-1" onClick={() => openApproveModal(loan)}>Aprobar</button>);
      actions.push(<button key="counter" className="btn btn-secondary text-xs flex-1" onClick={() => openNegotiateModal(loan)}>Negociar</button>);
      actions.push(<button key="cancel" className="btn bg-error-container text-error hover:bg-error-container/80 text-xs flex-1" onClick={() => cancelLoan(loan)}>Rechazar</button>);
    }

    if (!isOwner && loan.workflow_state === 'pending_handover') {
      actions.push(<button key="handover" className="btn btn-primary text-xs flex-1" onClick={() => openInputCodeModal(loan, 'handover')}>Recibir objeto (Código)</button>);
    }

    if (isOwner && loan.workflow_state === 'pending_handover') {
      actions.push(<button key="code" className="btn btn-secondary text-xs flex-1" onClick={() => getDeliveryCode(loan)}>Ver código para entregar</button>);
    }

    if (!isOwner && ['active', 'overdue'].includes(loan.workflow_state)) {
      actions.push(<button key="return" className="btn btn-primary text-xs flex-1" onClick={() => initiateReturn(loan)}>Devolver objeto</button>);
    }

    if (isOwner && ['active', 'overdue', 'return_pending', 'overdue_return_pending'].includes(loan.workflow_state)) {
      actions.push(<button key="confirm-return" className="btn btn-primary text-xs flex-1" onClick={() => openInputCodeModal(loan, 'return')}>Confirmar que ya me lo entregó</button>);
    }

    if (loan.workflow_state === 'completed') {
      actions.push(<button key="rate" className="btn btn-secondary text-xs flex-1" onClick={() => rateLoan(loan)}>Dejar Calificación</button>);
    }

    if (loan.workflow_state === 'cancelled') {
      actions.push(<button key="delete" className="btn bg-surface-container-lowest border border-outline-variant/30 text-on-surface/50 hover:bg-error-container hover:text-error hover:border-error/20 text-xs flex-1 transition-colors" onClick={() => deleteLoanHistory(loan)}>Borrar Registro</button>);
    }

    if (['active', 'return_pending', 'completed', 'overdue'].includes(loan.workflow_state)) {
      actions.push(
        <button 
          key="pdf" 
          className="btn bg-surface border border-outline-variant hover:bg-surface-container shadow-sm text-xs flex-1 text-on-surface" 
          onClick={() => downloadReceipt(loan)}
          title="Descargar Comprobante PDF"
        >
          <FileText size={14} className="text-primary mr-1" inline="true" /> Recibo PDF
        </button>
      );
    }

    actions.push(<button key="detail" className="btn text-xs text-primary hover:bg-primary-container flex-1" onClick={() => openDetail(loan.id)}>Ver detalles</button>);

    return actions;
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
        className="space-y-8 pb-16"
      >
      <motion.div variants={itemVariants} className="border-b border-outline-variant pb-6">
        <h1 className="text-sm font-semibold text-primary tracking-wide mb-1 uppercase">Centro Logístico</h1>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ArrowLeftRight className="text-primary w-8 h-8" /> Préstamos y Solicitudes
        </h2>
        <p className="text-on-surface/70 mt-2 max-w-xl">
          Administra de forma segura todos tus préstamos. Recuerda cumplir los plazos para mantener una buena reputación en tu conjunto.
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* PETICIONES ENVIADAS (BORROWED) */}
        <motion.div variants={itemVariants}>
          <div className="border-b border-outline-variant pb-4 mb-4">
            <h3 className="text-xl font-bold">Solicitaste Prestado</h3>
            <span className="text-sm text-on-surface/50 font-medium">Objetos que pediste prestados a tus vecinos.</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {borrowedLoans.length === 0 ? (
              <div className="p-8 text-center border-2 border-outline-variant/50 bg-surface-container-low border-dashed rounded-2xl text-on-surface/50 text-sm flex flex-col items-center gap-3">
                 <Info size={32} className="text-on-surface/20" />
                 Aún no has solicitado objetos. Ve al catálogo para encontrar algo útil.
              </div>
            ) : (
              <AnimatePresence>
                {borrowedLoans.map((loan) => (
                  <motion.article 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={loan.id} 
                    className="card !p-5 flex flex-col gap-4 border-l-4 border-l-primary bg-surface/90 backdrop-blur-sm border-outline-variant/40 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start border-b border-outline-variant/40 pb-3">
                      <div>
                        <h4 className="font-bold text-lg text-on-surface">{loan.item?.name}</h4>
                        <p className="text-sm text-on-surface/60">Dueño: <strong>{loan.item?.owner?.name}</strong></p>
                      </div>
                      <span className="badge bg-surface-container-high border border-outline-variant/30 text-on-surface">
                        {loan.workflow_label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full">
                      {renderActions(loan, false)}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* PETICIONES RECIBIDAS (LENT) */}
        <motion.div variants={itemVariants}>
          <div className="border-b border-outline-variant pb-4 mb-4">
            <h3 className="text-xl font-bold">Te Pidieron Prestado</h3>
            <span className="text-sm text-on-surface/50 font-medium">Vecinos que quieren usar tus objetos.</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {lentLoans.length === 0 ? (
              <div className="p-8 text-center border-2 border-outline-variant/50 bg-surface-container-low border-dashed rounded-2xl text-on-surface/50 text-sm flex flex-col items-center gap-3">
                 <ShieldCheck size={32} className="text-on-surface/20" />
                 Actualmente nadie ha solicitado tus objetos publicados.
              </div>
            ) : (
              <AnimatePresence>
                {lentLoans.map((loan) => (
                  <motion.article 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={loan.id} 
                    className="card !p-5 flex flex-col gap-4 border-l-4 border-l-warning bg-surface/90 backdrop-blur-sm border-outline-variant/40 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start border-b border-outline-variant/40 pb-3">
                      <div>
                        <h4 className="font-bold text-lg text-on-surface">{loan.item?.name}</h4>
                        <p className="text-sm text-on-surface/60 mt-1">Vecino: <strong className="text-primary">{loan.borrower?.name}</strong></p>
                      </div>
                      <span className="badge bg-primary-container text-primary shadow-sm">
                        {loan.workflow_label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full pt-1">
                      {renderActions(loan, true)}
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

    </motion.section>

      {/* DETAIL OVERLAY - OUTSIDE Transform Wrapper */}
      <AnimatePresence>
      {selectedLoan && (
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
            className="bg-surface rounded-3xl flex flex-col w-full max-w-4xl max-h-[90vh] shadow-[0_20px_60px_-15px_rgba(37,99,235,0.2)] overflow-hidden border border-outline-variant/50"
          >
            <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50 backdrop-blur-xl">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">Detalles del Préstamo #{selectedLoan.id}</h2>
              </div>
              <div className="flex gap-2">
                {['active', 'completed'].includes(selectedLoan.workflow_state) && (
                   <button className="btn bg-primary text-white text-xs shadow-md" onClick={() => downloadReceipt(selectedLoan)}>
                     <FileText size={14} className="mr-1" /> Imprimir Comprobante
                   </button>
                )}
                <button className="btn btn-secondary text-xs" onClick={() => setSelectedLoan(null)}>Cerrar ventana</button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-surface grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-sm font-bold text-on-surface/50 uppercase tracking-wide mb-4">Información Principal</h3>
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-on-surface/60">Objeto:</span><span className="font-bold">{selectedLoan.item?.name}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface/60">Propietario:</span><span className="font-bold">{selectedLoan.item?.owner?.name}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface/60">Solicitante:</span><span className="font-bold text-primary">{selectedLoan.borrower?.name}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface/60">Días acordados:</span><span className="font-bold">{selectedLoan.agreed_days || selectedLoan.proposed_days} días</span></div>
                      <div className="flex justify-between border-t border-outline-variant pt-3 mt-3"><span className="text-on-surface/60">Estado actual:</span><span className="badge badge-primary">{selectedLoan.workflow_label}</span></div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-sm font-bold text-on-surface/50 uppercase tracking-wide mb-4">Fechas Importantes</h3>
                  <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-on-surface/60">Aprobación:</span><span>{selectedLoan.approved_at ? new Date(selectedLoan.approved_at).toLocaleDateString() : 'Pendiente'}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface/60">Entrega Física:</span><span>{selectedLoan.start_date ? new Date(selectedLoan.start_date).toLocaleDateString() : 'Pendiente'}</span></div>
                      <div className="flex justify-between border-t border-outline-variant pt-3"><span className="font-bold text-error">Devolución Límite:</span><span className="font-bold text-error">{selectedLoan.expected_return_date ? new Date(selectedLoan.expected_return_date).toLocaleDateString() : 'Por determinar'}</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-on-surface/50 uppercase tracking-wide flex items-center gap-2 mb-4">
                     <MessageSquare size={16} /> Acuerdos y Propuestas
                  </h3>
                  <div className="space-y-3">
                    {(selectedLoan.negotiations || []).length === 0 && <div className="p-4 border border-outline-variant border-dashed rounded-lg text-sm text-on-surface/50">Cero negociaciones o cambios de propuesta.</div>}
                    {(selectedLoan.negotiations || []).map((negotiation) => {
                      const canAccept = negotiation.status === 'pending' && negotiation.user?.id !== user?.id && !selectedLoan.approved_at;
                      return (
                        <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant" key={negotiation.id}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <strong className="text-primary font-bold">{negotiation.proposed_days} Días Propuestos</strong>
                              <div className="text-xs text-on-surface/60 mt-0.5">Por: {negotiation.user?.name}</div>
                            </div>
                            <span className="badge badge-neutral bg-surface border border-outline-variant">{negotiation.status}</span>
                          </div>
                          <div className="text-sm text-on-surface/80 p-3 bg-surface rounded-lg mt-2 border border-outline-variant/30">"{negotiation.message || 'Sin comentario adicional.'}"</div>
                          {canAccept && (
                            <button className="btn btn-primary w-full text-sm mt-3" onClick={() => acceptNegotiation(negotiation.id, selectedLoan.id)}>
                              Aceptar esta propuesta
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-on-surface/50 uppercase tracking-wide flex items-center gap-2 mb-4">
                    <Clock size={16} /> Historial del Préstamo
                  </h3>
                  <div className="flex flex-col ml-2 border-l-2 border-outline-variant/50 pl-6 space-y-5">
                    {(selectedLoan.history || []).map((entry, index) => (
                       <div className="relative" key={entry.id}>
                         <div className="absolute w-3 h-3 rounded-full bg-primary -left-[31px] top-1"></div>
                         <div>
                           <div className="font-bold text-sm">{entry.action}</div>
                           <div className="text-xs text-on-surface/50 mt-1 mb-2">{new Date(entry.created_at).toLocaleString()}</div>
                           <span className="badge badge-neutral text-[10px]">{entry.new_status}</span>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODAL DE NEGOCIACIÓN */}
      <AnimatePresence>
        {negotiateModal.isOpen && (
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
                className="bg-surface rounded-3xl flex flex-col w-full max-w-md shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <MessageSquare className="text-primary w-5 h-5"/> Enviar Propuesta
                  </h2>
                  <button 
                    className="btn btn-secondary !py-1.5 !px-2 text-on-surface/50 hover:text-on-surface hover:bg-surface-container bg-transparent border-none transition-colors" 
                    onClick={() => setNegotiateModal({ isOpen: false, loan: null, days: 7, messageText: '' })}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                     <p className="text-sm text-on-surface/60 font-bold mb-1">Objeto en negociación:</p>
                     <p className="text-on-surface font-bold text-lg leading-tight">{negotiateModal.loan?.item?.name}</p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="label text-sm font-bold text-on-surface/70 block mb-2">¿Nueva cantidad de días? (Máx 14)</label>
                    <input 
                      type="number"
                      min="1"
                      max="14"
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-4 text-2xl text-primary font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner text-center"
                      value={negotiateModal.days}
                      onChange={(e) => setNegotiateModal({ ...negotiateModal, days: e.target.value })}
                    />
                  </div>

                  <div className="mb-8">
                    <label className="label text-sm font-bold text-on-surface/70 block mb-2">Mensaje al vecino (Opcional)</label>
                    <textarea 
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner resize-y min-h-[80px]"
                      placeholder="Ej: Te lo presto, pero devuélvemelo limpio por favor..."
                      value={negotiateModal.messageText}
                      onChange={(e) => setNegotiateModal({ ...negotiateModal, messageText: e.target.value })}
                    />
                  </div>
                  
                  <button onClick={confirmNegotiation} className="btn btn-primary w-full py-4 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-base font-bold flex justify-center items-center gap-2">
                     <ArrowLeftRight size={20} /> Proponer Trato
                  </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE APROBACIÓN */}
      <AnimatePresence>
        {approveModal.isOpen && (
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
                className="bg-surface rounded-3xl flex flex-col w-full max-w-md shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <CheckCircle className="text-success w-5 h-5"/> Aprobar Préstamo
                  </h2>
                  <button 
                    className="btn btn-secondary !py-1.5 !px-2 text-on-surface/50 hover:text-on-surface hover:bg-surface-container bg-transparent border-none transition-colors" 
                    onClick={() => setApproveModal({ isOpen: false, loan: null, days: 7 })}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                     <p className="text-sm text-on-surface/60 font-bold mb-1">Entregarás tu objeto a:</p>
                     <p className="text-on-surface font-bold text-lg leading-tight">{approveModal.loan?.borrower?.name}</p>
                     <p className="text-xs text-on-surface/50 mt-1">Acabas de pactar prestar el: {approveModal.loan?.item?.name}</p>
                  </div>
                  
                  <div className="mb-8">
                    <label className="label text-sm font-bold text-on-surface/70 block mb-2">¿Para cuántos días autorizas dárselo?</label>
                    <input 
                      type="number"
                      min="1"
                      max="14"
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-4 text-3xl text-success font-black focus:border-success focus:ring-4 focus:ring-success/10 outline-none transition-all duration-300 shadow-inner text-center"
                      value={approveModal.days}
                      onChange={(e) => setApproveModal({ ...approveModal, days: e.target.value })}
                    />
                    <p className="text-xs text-on-surface/50 text-center mt-3 font-semibold">Puedes modificar la propuesta si solo deseas prestárselo por menos tiempo sin necesidad de negociar.</p>
                  </div>
                  
                  <button onClick={confirmApproval} className="btn bg-success hover:bg-success/90 text-white w-full py-4 shadow-md shadow-success/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-base font-bold flex justify-center items-center gap-2">
                     <CheckCircle size={20} /> Proceder a la Entrega
                  </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA MOSTRAR CÓDIGO (DUEÑO o PRESTATARIO DEVOLVIENDO) */}
      <AnimatePresence>
        {displayCodeModal.isOpen && (
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
                className="bg-surface rounded-3xl flex flex-col w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <ShieldCheck className="text-primary w-5 h-5"/> {displayCodeModal.title}
                  </h2>
                </div>
                
                <div className="p-8 text-center flex flex-col items-center">
                  <p className="text-sm text-on-surface/70 font-medium mb-6 leading-relaxed">
                     {displayCodeModal.message}
                  </p>
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-2xl w-full py-6 flex justify-center items-center mb-8 shadow-inner">
                     <span className="font-mono text-5xl font-black text-primary tracking-[0.2em] ml-3">{displayCodeModal.code}</span>
                  </div>
                  
                  <button onClick={() => setDisplayCodeModal({ isOpen: false, code: '', title: '', message: '' })} className="btn btn-primary w-full py-3 shadow-md shadow-primary/20 hover:shadow-lg transition-all text-sm font-bold">
                     Ya lo dicté, Cerrar
                  </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA INGRESAR CÓDIGO (PRESTATARIO o DUEÑO RECIBIENDO) */}
      <AnimatePresence>
        {inputCodeModal.isOpen && (
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
                className="bg-surface rounded-3xl flex flex-col w-full max-w-sm shadow-[0_20px_60px_-15px_rgba(234,179,8,0.2)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <ShieldCheck className="text-warning w-5 h-5"/> {inputCodeModal.title}
                  </h2>
                  <button 
                    className="btn btn-secondary !py-1.5 !px-2 text-on-surface/50 hover:text-on-surface hover:bg-surface-container bg-transparent border-none transition-colors" 
                    onClick={() => setInputCodeModal({ isOpen: false, loan: null, actionType: '', title: '', message: '', code: '' })}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 text-center">
                  <p className="text-sm text-on-surface/70 font-medium mb-6 leading-relaxed">
                     {inputCodeModal.message}
                  </p>
                  
                  {inputCodeModal.errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-error/10 border border-error/20 text-error text-sm font-bold rounded-xl flex items-center justify-center gap-2">
                       <AlertTriangle size={16} /> {inputCodeModal.errorMsg}
                    </motion.div>
                  )}
                  
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-6 text-4xl font-mono text-warning font-black tracking-[0.3em] focus:border-warning focus:ring-4 focus:ring-warning/10 outline-none transition-all duration-300 shadow-inner text-center uppercase mb-6"
                    value={inputCodeModal.code}
                    onChange={(e) => setInputCodeModal({ ...inputCodeModal, code: e.target.value.toUpperCase(), errorMsg: '' })}
                  />
                  
                  <button onClick={submitInputCode} className="btn bg-warning hover:bg-warning/90 text-yellow-950 w-full py-4 shadow-md shadow-warning/20 hover:shadow-lg transition-all text-base font-bold flex justify-center items-center gap-2">
                     <CheckCircle size={20} /> Validar y Confirmar
                  </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE ACCIÓN (Cancelación/Borrado) */}
      <AnimatePresence>
        {confirmModal.isOpen && (
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
                     <AlertTriangle className="text-error w-5 h-5"/> Confirmar Acción
                  </h2>
                </div>
                
                <div className="p-8 text-center flex flex-col items-center">
                  <p className="text-sm text-on-surface/70 font-medium mb-8 leading-relaxed">
                     {confirmModal.message}
                  </p>
                  
                  <div className="flex gap-4 w-full">
                    <button onClick={() => setConfirmModal({ isOpen: false, message: '', confirmAction: null })} className="btn btn-secondary flex-1 shadow-sm transition-all text-sm font-bold">
                       Atrás
                    </button>
                    <button onClick={() => { confirmModal.confirmAction(); setConfirmModal({ isOpen: false, message: '', confirmAction: null }); }} className="btn bg-error hover:bg-error/90 text-white flex-1 shadow-md shadow-error/20 hover:shadow-lg transition-all text-sm font-bold flex justify-center items-center gap-2">
                       Proceder
                    </button>
                  </div>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL PARA CALIFICAR (RATE) */}
      <AnimatePresence>
        {ratingModal.isOpen && (
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
                className="bg-surface rounded-3xl flex flex-col w-full max-w-md shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] overflow-hidden border border-outline-variant/50 max-h-[90vh]"
             >
                <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-low/50">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                     <MessageSquare className="text-primary w-5 h-5"/> Calificar Vecino
                  </h2>
                  <button 
                    className="btn btn-secondary !py-1.5 !px-2 text-on-surface/50 hover:text-on-surface hover:bg-surface-container bg-transparent border-none transition-colors" 
                    onClick={() => setRatingModal({ isOpen: false, loan: null, score: 5, comment: '' })}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <label className="label text-sm font-bold text-on-surface/70 block mb-2">Puntuación de 1 a 5 Estrellas</label>
                    <input 
                      type="number"
                      min="1"
                      max="5"
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-4 text-3xl text-primary font-black focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner text-center"
                      value={ratingModal.score}
                      onChange={(e) => setRatingModal({ ...ratingModal, score: Number(e.target.value) })}
                    />
                  </div>

                  <div className="mb-8">
                    <label className="label text-sm font-bold text-on-surface/70 block mb-2">Cuentanos tu experiencia (Opcional)</label>
                    <textarea 
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner resize-y min-h-[80px]"
                      placeholder="Ej: Muy puntual en la devolución y lo entregó intacto..."
                      value={ratingModal.comment}
                      onChange={(e) => setRatingModal({ ...ratingModal, comment: e.target.value })}
                    />
                  </div>
                  
                  <button onClick={confirmRating} className="btn btn-primary w-full py-4 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all text-base font-bold flex justify-center items-center gap-2">
                     <CheckCircle size={20} /> Guardar Evaluación
                  </button>
                </div>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
