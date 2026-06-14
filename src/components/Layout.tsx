import { NavLink, Outlet } from 'react-router-dom';
import { Users, Layers, Scale, AlertTriangle, Database, Shield } from 'lucide-react';

const navItems = [
  { to: '/actors', label: '演员录入', icon: Users },
  { to: '/formation', label: '队形搭建', icon: Layers },
  { to: '/load-check', label: '承重校核', icon: Scale },
  { to: '/stability', label: '失稳预警', icon: AlertTriangle },
  { to: '/library', label: '方案库', icon: Database },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 glass-card border-r border-navy-700/50 flex flex-col">
        <div className="p-6 border-b border-navy-700/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #E9C46A, #d4a93f)', boxShadow: '0 4px 12px rgba(233, 196, 106, 0.3)' }}>
              <Shield className="w-6 h-6 text-navy-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-display text-xl text-safety-gold leading-tight">安全塔</h1>
              <p className="text-xs text-navy-300">杂技受力预警系统</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-navy-700/40">
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-navy-200">
              <div className="w-2 h-2 rounded-full bg-safety-green animate-pulse" />
              <span>离线模式 · 数据本地存储</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="page-enter min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
