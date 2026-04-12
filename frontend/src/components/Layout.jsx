import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutDashboard, PackageSearch, PackageOpen, ArrowLeftRight, Bell, User, LogOut, Settings, BarChart2, ShieldAlert, Share2 } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const privateLinks = [
    { to: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { to: '/loans', label: 'PRÉSTAMOS', icon: ArrowLeftRight },
    { to: '/my-items', label: 'MIS OBJETOS', icon: PackageOpen },
    { to: '/catalog', label: 'CATÁLOGO', icon: PackageSearch },
    { to: '/notifications', label: 'NOTIFICACIONES', icon: Bell },
    { to: '/profile', label: 'PERFIL', icon: User },
  ];

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface flex text-on-surface font-sans">
      {/* Sidebar: Structural Section (surface-container-low) */}
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/15 flex flex-col hidden md:flex fixed h-full z-10">
        <div className="p-8 pb-8 border-b border-outline-variant/15">
          <Link to="/" className="flex flex-col mb-1 group">
            <h1 className="text-xl font-black tracking-tighter text-on-surface">Vecinos<span className="text-primary">Red</span></h1>
          </Link>
          <p className="text-[11px] font-bold tracking-widest uppercase text-on-surface/50">Préstamos Comunitarios</p>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          {privateLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-4 px-8 py-3 text-sm font-semibold tracking-wider uppercase transition-colors duration-200 border-l-4 ${
                  isActive 
                    ? 'bg-surface-container border-primary text-primary' 
                    : 'border-transparent text-on-surface/70 hover:bg-surface-container-high/50 hover:text-on-surface'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {link.label}
              </Link>
            );
          })}
          
          {user?.role === 'admin' && (
            <>
              <div className="px-8 mt-6 mb-2">
                <span className="label-md text-on-surface/40">ADMINISTRACIÓN</span>
              </div>
              <Link
                to="/admin"
                className={`flex items-center gap-4 px-8 py-3 text-sm font-semibold tracking-wider uppercase transition-colors duration-200 border-l-4 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-surface-container border-error text-error' 
                    : 'border-transparent text-on-surface/70 hover:bg-surface-container-high/50 hover:text-on-surface'
                }`}
              >
                <BarChart2 size={18} strokeWidth={2} />
                MÉTRICAS Y CONTROL
              </Link>
            </>
          )}
        </nav>

        <div className="p-6 border-t border-outline-variant/15 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high flex items-center justify-center font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="label-md text-on-surface/60">{user?.apartment || 'RESIDENTE'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-error hover:text-error/80 text-xs font-bold uppercase tracking-wider mt-2 transition-colors"
          >
            <LogOut size={14} strokeWidth={2.5} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        {/* Executive Console Header */}
        <header className="h-16 glass-panel sticky top-0 z-20 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="label-md text-on-surface/50">Centro de Operaciones</span>
            <span className="text-outline-variant">/</span>
            <span className="label-md text-on-surface">Portal</span>
          </div>
          <div className="flex items-center gap-6">
             <Link to="/notifications" className="relative text-on-surface/70 hover:text-on-surface transition-colors">
                <Bell size={20} strokeWidth={2} />
             </Link>
             <Link to="/profile" className="text-on-surface/70 hover:text-on-surface transition-colors">
                <Settings size={20} strokeWidth={2} />
             </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
