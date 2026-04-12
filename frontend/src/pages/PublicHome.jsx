import { Link } from 'react-router-dom';
import { Shield, History, Activity, LogIn, Share2 } from 'lucide-react';

export default function PublicHome() {
  


  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center py-4 px-6 lg:px-12 glass-header relative">
        <div className="flex items-center gap-2 group cursor-pointer">
          <h1 className="text-2xl font-black tracking-tighter text-on-surface">Vecinos<span className="text-primary">Red</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-on-surface/70 hover:text-primary transition-colors flex items-center gap-2">
            Iniciar Sesión <LogIn size={16}/>
          </Link>
          <Link to="/register" className="btn btn-primary hidden sm:flex">
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-surface-container-low px-6 py-20 lg:py-32 lg:px-12 text-center lg:text-left">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container text-primary-dim rounded-full text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-primary block animate-pulse"></span> COMUNIDAD PRIVADA
            </div>
            <h2 className="display-lg">
              Préstamos comunitarios seguros y sin complicaciones.
            </h2>
            <p className="text-lg opacity-80 max-w-lg leading-relaxed mx-auto lg:mx-0">
              Un espacio seguro para que los residentes de tu conjunto presten y soliciten objetos como herramientas, electrodomésticos y más. Fomenta la circularidad con total confianza.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <Link to="/register" className="btn btn-primary text-base px-8 py-3.5">Crear cuenta</Link>
              <a href="#como-funciona" className="btn btn-secondary text-base px-8 py-3.5">Conocer más</a>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-float relative">
               <img src="/hero_residential.png" alt="Vecinos interactuando" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent mix-blend-multiply"></div>
            </div>
            {/* Decal */}
            <div className="absolute -bottom-8 -left-8 bg-surface p-6 rounded-2xl shadow-float max-w-xs flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-success-container text-success flex items-center justify-center shrink-0">
                 <Shield className="w-6 h-6"/>
               </div>
               <div>
                  <div className="font-bold tracking-tight">Verificación Estricta</div>
                  <div className="text-sm opacity-70">Uso de códigos dinámicos para entregas.</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="como-funciona" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h3 className="text-primary font-bold tracking-wide text-sm mb-2">CÓMO FUNCIONA</h3>
          <h4 className="text-3xl font-bold tracking-tight mb-4">Múltiples capas de seguridad</h4>
          <p className="text-on-surface/70 leading-relaxed">
            Hemos diseñado VecinosRed pensando en la tranquilidad de todos los residentes, ofreciendo un registro detallado de cada objeto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card card-hover flex gap-6 items-start">
             <div className="p-3 rounded-xl bg-primary-container text-primary">
               <Shield className="w-6 h-6" />
             </div>
             <div>
               <h5 className="font-bold text-lg mb-2">Intercambio Código 6-Dígitos</h5>
               <p className="text-sm opacity-70 leading-relaxed">
                 Nadie puede decir que entregó algo si la otra persona no lo recibió. El intercambio se sella digitalmente con un pin dinámico, eliminando malentendidos.
               </p>
             </div>
          </div>
          <div className="card card-hover flex gap-6 items-start">
             <div className="p-3 rounded-xl bg-primary-container text-primary">
               <History className="w-6 h-6" />
             </div>
             <div>
               <h5 className="font-bold text-lg mb-2">Historial Transparente</h5>
               <p className="text-sm opacity-70 leading-relaxed">
                 Un registro inmutable de todos tus préstamos. Podrás ver cuándo lo prestaste, hasta qué fecha límite, y realizar reclamos basados en hechos.
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer Content */}
      <footer className="py-8 px-6 lg:px-12 border-t border-outline-variant bg-surface text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm font-medium text-on-surface/60">
          © {new Date().getFullYear()} VecinosRed. Hecho para comunidades.
        </div>
        <div className="flex gap-6 text-sm font-medium text-on-surface/60">
          <a href="#" className="hover:text-primary transition-colors">Términos</a>
          <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
