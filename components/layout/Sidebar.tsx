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
        src="/logo.png"
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
  isHealthCardGenerated?: boolean;
}

export function Sidebar({ isMobileOpen, onMobileClose, isHealthCardGenerated }: SidebarProps) {
  const pathname = usePathname();

  const sidebarLinks = [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Score Methodology", href: "/scoring-engine", icon: <Cpu className="h-4 w-4" /> },
    { label: "Business Profile", href: "/#business-profile", icon: <Briefcase className="h-4 w-4" /> },
    { label: "Alternate Data Overview", href: "/#data-overview", icon: <Database className="h-4 w-4" /> },
    { label: "Financial Health Score", href: "/#idbi-health-card-container", icon: <BarChart2 className="h-4 w-4" /> },
    { label: "Strengths & Risks Analysis", href: "/#strengths-risks", icon: <ShieldAlert className="h-4 w-4" /> },
    { label: "Actionable Insights", href: "/#recommendations", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Health Optimization", href: "/#credit-limit", icon: <Scale className="h-4 w-4" /> },
    { label: "Integrate Alternate Data", href: "/#documents", icon: <FolderOpen className="h-4 w-4" /> },
    { label: "Activity Log", href: "/#activity-log", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <>
      {/* ─── Left Sidebar (Desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-67 bg-sidebar text-sidebar-foreground border-r border-[#00836C]/30 flex-shrink-0 sticky top-0 h-screen">
        {/* Logo Section */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#00836C]/30 bg-black/10">
          <IdbiLogo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarLinks.map((link, idx) => {
            const isActive = pathname === link.href;
            const isDisabled = isHealthCardGenerated && (link.label === "Business Profile" || link.label === "Alternate Data Overview");
            return (
              <Link
                key={idx}
                href={isDisabled ? "#" : link.href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    return;
                  }
                  if (pathname === "/") {
                    if (link.href.startsWith("/#")) {
                      e.preventDefault();
                      const hash = link.href.substring(2);
                      window.history.pushState(null, "", `#${hash}`);
                      window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { sectionId: hash } }));
                    }
                  } else {
                    if (link.href.startsWith("/#")) {
                      const hash = link.href.substring(2);
                      window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { sectionId: hash } }));
                    }
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 ${isDisabled
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : isActive
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
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-underwriter-chat'));
              }}
              className="w-full text-center py-2 bg-transparent hover:bg-primary/20 border border-primary text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              Launch Underwriting Chat
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="relative flex flex-col w-72 bg-sidebar text-sidebar-foreground h-full">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#00836C]/30 bg-black/10">
              <IdbiLogo />
              <button onClick={onMobileClose} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {sidebarLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                const isDisabled = isHealthCardGenerated && (link.label === "Business Profile" || link.label === "Alternate Data Overview");
                return (
                  <Link
                    key={idx}
                    href={isDisabled ? "#" : link.href}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                        return;
                      }
                      if (onMobileClose) onMobileClose();
                      if (pathname === "/") {
                        if (link.href.startsWith("/#")) {
                          e.preventDefault();
                          const hash = link.href.substring(2);
                          window.history.pushState(null, "", `#${hash}`);
                          window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { sectionId: hash } }));
                        }
                      } else {
                        if (link.href.startsWith("/#")) {
                          const hash = link.href.substring(2);
                          window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: { sectionId: hash } }));
                        }
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${isDisabled
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : isActive
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
