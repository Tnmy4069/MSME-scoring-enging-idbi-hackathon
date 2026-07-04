"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Briefcase, Database, BarChart2, 
  ShieldAlert, Sparkles, Scale, FolderOpen, History, 
  HelpCircle, X, Cpu
} from "lucide-react";

export function IdbiLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="https://www.logoshape.com/wp-content/uploads/2024/09/idbi-icon-vector_logoshape.png"
        alt="IDBI Logo"
        className="w-7 h-7 flex-shrink-0 object-contain"
      />
      <div className="flex flex-col">
        <span className="text-white text-lg font-black tracking-wider leading-none">IDBI</span>
        <span className="text-[7px] text-[#f05a28] tracking-widest font-black leading-none mt-1">BANK</span>
      </div>
    </div>
  );
}

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarLinks = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Scoring Engine", href: "/scoring-engine", icon: <Cpu className="h-4 w-4" /> },
    { label: "Business Profile", href: "#", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Data Overview", href: "#", icon: <Database className="h-4 w-4" /> },
    { label: "Score & Insights", href: "#", icon: <BarChart2 className="h-4 w-4" /> },
    { label: "Strengths & Risks", href: "#", icon: <ShieldAlert className="h-4 w-4" /> },
    { label: "Recommendations", href: "#", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Credit Limit", href: "#", icon: <Scale className="h-4 w-4" /> },
    { label: "Documents", href: "#", icon: <FolderOpen className="h-4 w-4" /> },
    { label: "Activity Log", href: "#", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* ─── Left Sidebar (Desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-56 bg-sidebar text-sidebar-foreground border-r border-[#00836C]/30 flex-shrink-0">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#00836C]/30 bg-black/10">
          <IdbiLogo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={idx}
                href={link.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-primary-foreground font-bold' 
                    : 'text-slate-300 hover:text-white hover:bg-black/20'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Assistant/Help panel at bottom */}
        <div className="p-4 border-t border-[#00836C]/30">
          <div className="bg-black/10 rounded-md p-4 border border-[#00836C]/30">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider mb-1">
              <HelpCircle className="h-4 w-4 text-idbi-gold" /> Need Help?
            </div>
            <p className="text-[11px] text-slate-300 leading-normal mb-3">Talk to Assistant</p>
            <button className="w-full text-center py-2 bg-transparent hover:bg-primary/20 border border-primary text-white text-xs font-bold rounded-full transition-colors cursor-pointer">
              Launch Underwriting Chat
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative flex flex-col w-56 bg-sidebar text-sidebar-foreground h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#00836C]/30 bg-black/10">
              <IdbiLogo />
              <button onClick={onMobileClose} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {sidebarLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={idx}
                    href={link.href}
                    onClick={onMobileClose}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-primary text-primary-foreground font-bold' 
                        : 'text-slate-300 hover:text-white hover:bg-black/20'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
