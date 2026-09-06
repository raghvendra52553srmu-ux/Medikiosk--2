import { useState, } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { LayoutDashboard, Users, Settings, LogOut, Menu, X, ChevronDown, MapPin } from "lucide-react";
import { readFacilitySession } from "@/services/hospitalService";
import { logoutStaff } from "@/services/authService";

const NAV = [
  { to: "/doctor/dashboard", label: "Today", icon: LayoutDashboard },
  { to: "/doctor/queue", label: "Queue", icon: Users },
  { to: "/doctor/settings", label: "Settings", icon: Settings },
];

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function DoctorLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const facility = readFacilitySession();

  return (
    <div className="app-ambient flex min-h-full">
      {/* Rail — desktop */}
      <aside className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col border-r border-line bg-white/45 dark:bg-zinc-950/70 backdrop-blur-2xl saturate-150 lg:flex">
        <div className="flex h-[60px] items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-emerald-600 font-display text-base font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">M</span>
          <span className="font-display text-base md:text-lg font-semibold tracking-[-0.02em] text-ink">MediKiosk</span>
        </div>

        <div className="border-b border-zinc-200/60 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">Clinic</p>
          <p className="mt-1.5 text-base font-medium leading-snug text-zinc-800 dark:text-zinc-200">Dr. Sunita Patil</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">General Medicine OPD</p>
          {facility?.place && (
            <p className="mt-2 flex items-start gap-1.5 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
              <MapPin className="mt-px h-3 w-3 shrink-0" />
              {facility.hospitals.length ? "Field session active" : "No facility session"}
            </p>
)}
        </div>

        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {NAV.map(item => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-base transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)]",
                    isActive
                      ? "bg-ink font-medium text-white shadow-[0_10px_26px_-16px_rgba(11,11,12,0.8)] dark:bg-white dark:text-zinc-900"
                      : "text-ink/65 hover:bg-ink/[0.055] hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
)}
                >
                  <item.icon className="h-4 w-4 shrink-0 transition-transform duration-[420ms] [transition-timing-function:var(--ease-spring)] group-hover:-translate-y-px" />
                  {item.label}
                </NavLink>
              </li>
))}
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <button
            onClick={async () => {
              await logoutStaff();
              navigate("/");
            }}
            className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-base text-ink/60 transition-colors duration-300 hover:bg-ink/[0.055] hover:text-ink dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Rail — mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-blur-in absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setNavOpen(false)} />
          <aside className="glass-strong animate-rise absolute inset-y-0 left-0 flex w-[264px] flex-col border-r border-line">
            <div className="flex h-[60px] items-center justify-between border-b border-line px-4">
              <span className="font-display text-base md:text-lg font-semibold text-ink">MediKiosk</span>
              <button onClick={() => setNavOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-ink/55 hover:bg-ink/[0.06]">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <nav className="flex-1 p-3">
              {NAV.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) => cn(
                    "mb-1 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-base",
                    isActive ? "bg-ink font-medium text-white dark:bg-white dark:text-zinc-900" : "text-ink/70 hover:bg-ink/[0.055] dark:text-zinc-300"
)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
))}
            </nav>
          </aside>
        </div>
)}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line bg-white/65 dark:bg-zinc-950/80 px-4 backdrop-blur-2xl saturate-150 sm:px-6">
          <button
            className="rounded-lg p-2 text-ink/65 transition-colors hover:bg-ink/[0.06] lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="hidden text-sm sm:text-base text-zinc-500 dark:text-zinc-400 lg:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <button className="group flex items-center gap-2.5 rounded-[10px] border border-zinc-200 bg-white/55 dark:border-zinc-700 dark:bg-white/[0.06] py-1.5 pl-1.5 pr-2.5 transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)] hover:border-zinc-300 hover:bg-white/85 dark:hover:border-zinc-600 dark:hover:bg-white/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">SP</span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm sm:text-base font-medium leading-tight text-zinc-800 dark:text-zinc-200">Dr. Sunita Patil</span>
                <span className="block text-sm leading-tight text-zinc-500 dark:text-zinc-400">General Medicine</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 group-hover:translate-y-px sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
);
}
