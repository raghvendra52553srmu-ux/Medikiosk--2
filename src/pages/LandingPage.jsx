import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { logoutStaff } from "@/services/authService";
import { cn } from "@/utils/cn";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Globe2,
  HeartHandshake,
  History,
  Lock,
  Menu,
  Mic,
  ShieldCheck,
  Stethoscope,
  Ticket,
  User,
  X,
  BarChart3,
  Smartphone,
  Moon,
  FileText,
  Users,
  Landmark,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home", href: "home" },
  { label: "About", href: "about" },
  { label: "How It Works", href: "how-it-works" },
  { label: "Features", href: "features" },
  { label: "Roles", href: "roles" },
];

const FEATURES = [
  { icon: ClipboardList, title: "Digital OPD Registration", desc: "Patients register digitally at the kiosk, eliminating paper forms and manual entry." },
  { icon: History, title: "Patient Medical History", desc: "Structured intake collects symptoms and past history before the consultation begins." },
  { icon: Ticket, title: "OPD Token Generation", desc: "An OPD token is issued automatically and placed into the doctor's queue." },
  { icon: Globe2, title: "Multilingual Interface", desc: "Supports English, Hindi, Bengali, Marathi, Tamil and Telugu for diverse patients." },
  { icon: Users, title: "Doctor Queue", desc: "Doctors see a live queue with patient history pre-loaded before calling each patient." },
  { icon: ShieldCheck, title: "Protected Role-Based Access", desc: "Doctor and admin screens are PIN-protected and never accessible from the patient kiosk." },
  { icon: FileText, title: "Clinical History Review", desc: "Doctors can review structured clinical notes and uploaded documents before consultation." },
  { icon: BarChart3, title: "Hospital Operations Monitoring", desc: "Admins track OPD load, token flow and kiosk health from a protected dashboard." },
  { icon: Smartphone, title: "Kiosk-Friendly Interface", desc: "Large touch targets, voice input and simple flows designed for all literacy levels." },
  { icon: Moon, title: "Light & Dark Mode", desc: "Full theme support for bright hospital lighting and low-light environments." },
];

const STEPS = [
  {
    number: "01", icon: Globe2,
    title: "Choose Your Language",
    desc: "Patients interact with the kiosk in their preferred language from six regional options.",
    cardCls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconCls: "text-emerald-700 dark:text-emerald-400",
    numCls: "text-emerald-600 dark:text-emerald-500",
  },
  {
    number: "02", icon: User,
    title: "Register at the Kiosk",
    desc: "Enter basic details — name, age, gender and mobile — to begin the OPD intake process.",
    cardCls: "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800",
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconCls: "text-zinc-700 dark:text-zinc-300",
    numCls: "text-zinc-500 dark:text-zinc-400",
  },
  {
    number: "03", icon: Mic,
    title: "Share Your History",
    desc: "Speak or type your symptoms and medical history before the consultation — works in your language.",
    cardCls: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconCls: "text-amber-700 dark:text-amber-400",
    numCls: "text-amber-600 dark:text-amber-500",
  },
  {
    number: "04", icon: Ticket,
    title: "Receive Your OPD Token",
    desc: "The system generates your OPD token and places you into the doctor's queue automatically.",
    cardCls: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    iconCls: "text-indigo-700 dark:text-indigo-400",
    numCls: "text-indigo-600 dark:text-indigo-500",
  },
  {
    number: "05", icon: Stethoscope,
    title: "Doctor Reviews Before Consultation",
    desc: "The doctor reviews your submitted history and symptoms before calling you into the room.",
    cardCls: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    iconCls: "text-teal-700 dark:text-teal-400",
    numCls: "text-teal-600 dark:text-teal-500",
  },
];

const VALUE_PROPS = [
  "Reduce repetitive OPD registration paperwork",
  "Capture patient history before the consultation begins",
  "Give doctors structured information earlier",
  "Improve patient flow through the OPD",
  "Separate patient and staff access by role",
  "Provide a kiosk-friendly experience for all literacy levels",
  "Support multilingual patient interaction",
  "Enable hospital operations visibility for admins",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { setRole, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePatientStart = () => { setRole("patient"); navigate("/patient/problem"); };
  const handleDoctorLogin = () => navigate("/doctor/dashboard");
  const handleAdminLogin = () => navigate("/admin/dashboard");

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // Returning to the public home screen ends any staff session on this terminal,
  // so the next person at a shared kiosk cannot walk into a clinical view.
  useEffect(() => {
    void logoutStaff();
  }, []);

  return (
    // Use min-h-screen (not min-h-full which requires a parent with a fixed height)
    <div className="app-ambient min-h-screen flex flex-col" id="home">

      {/* ────────────────── NAVBAR ────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-2xl saturate-150 dark:border-zinc-800 dark:bg-zinc-950/90 shadow-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* Brand */}
          <button type="button" onClick={() => scrollTo("home")} className="flex items-center gap-3 cursor-pointer shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-display text-lg font-bold text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950">
              M
            </span>
            <div className="flex flex-col text-left">
              <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                MediKiosk
              </span>
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hidden lg:block mt-0.5">
                {t("role.headerSubtitle")}
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-base font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-all duration-150 cursor-pointer"
              >
                {link.label}
              </button>
))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePatientStart}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-base font-semibold text-zinc-800 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
            >
              <User className="h-4 w-4" />
              Patient Login
            </button>
            <button
              type="button"
              onClick={handleDoctorLogin}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-base font-semibold text-zinc-800 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
            >
              <Stethoscope className="h-4 w-4" />
              Doctor Login
            </button>
            <button
              type="button"
              onClick={handleAdminLogin}
              className="hidden xl:inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-base font-semibold text-zinc-800 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              Hospital Admin
            </button>
            <LanguageSelector variant="compact" />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(v => !v)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer shadow-sm"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen
                ? <X className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
                : <Menu className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white/98 dark:bg-zinc-950/98 px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="w-full text-left rounded-lg px-3 py-2.5 text-lg font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {link.label}
              </button>
))}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-3 gap-2">
              <button type="button" onClick={handlePatientStart} className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-zinc-800 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer">
                <User className="h-4 w-4 shrink-0" /> Patient
              </button>
              <button type="button" onClick={handleDoctorLogin} className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-zinc-800 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer">
                <Stethoscope className="h-4 w-4 shrink-0" /> Doctor
              </button>
              <button type="button" onClick={handleAdminLogin} className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-zinc-800 border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 cursor-pointer">
                <Building2 className="h-4 w-4 shrink-0" /> Admin
              </button>
            </div>
          </div>
)}
      </header>

      {/* ────────────────── MAIN CONTENT ────────────────── */}
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

          {/* ── HERO ─────────────────────────────────────────── */}
          <section id="home" className="py-20 lg:py-28 scroll-mt-16">
            {/* Eyebrow row */}
            <div className="flex flex-wrap items-center gap-2 mb-6 reveal">
              <span className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {t("role.tagline")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Landmark className="h-3.5 w-3.5" />
                {t("role.badge.gov")} & {t("role.badge.pvt")}
              </span>
            </div>

            {/* Headline */}
            <h1 className="reveal font-display font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50
              text-5xl sm:text-6xl lg:text-7xl xl:text-7xl
              max-w-4xl"
              style={{ "--i": 1 } }
            >
              {t("role.heroTitle")}
              <span className="block text-zinc-400 dark:text-zinc-500">{t("role.heroSubtitle")}</span>
            </h1>

            {/* Subheading */}
            <p className="reveal mt-6 text-xl sm:text-2xl leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl"
              style={{ "--i": 2 } }
            >
              {t("role.heroDescription")}
            </p>

            {/* Flow pills */}
            <div className="reveal mt-8 flex flex-wrap items-center gap-2"
              style={{ "--i": 3 } }
            >
              {["Patient", "History", "OPD Token", "Doctor"].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-base font-semibold text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    {step}
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-600 shrink-0" />}
                </span>
))}
            </div>

            {/* CTA buttons */}
            <div className="reveal mt-10 flex flex-wrap gap-4"
              style={{ "--i": 4 } }
            >
              <button
                type="button"
                onClick={handlePatientStart}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition-all duration-150 cursor-pointer dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
              >
                <Mic className="h-5 w-5" />
                {t("guide.startBtn")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-8 py-4 text-lg font-bold text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 transition-all duration-150 cursor-pointer dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
              >
                {t("guide.heading")}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Status bar */}
            <div className="reveal mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-medium text-zinc-500 dark:text-zinc-400"
              style={{ "--i": 5 } }
            >
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("role.pin.patient")}
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t("role.pin.doctor")}
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t("role.pin.admin")}
              </span>
            </div>
          </section>

          {/* ── ABOUT / MODEL OVERVIEW ────────────────────── */}
          <section id="about" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Platform Overview</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                One platform. Three connected experiences.
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {/* Patient */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/80 p-6 sm:p-7 dark:border-emerald-500/30 dark:bg-emerald-950/30">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 mb-5">
                  <User className="h-5 w-5" />
                </span>
                <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("role.patient.title")}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {t("role.patient.desc")}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Open access
                </span>
              </div>

              {/* Doctor */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 mb-5">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("role.doctor.title")}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {t("role.doctor.desc")}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
                  <Lock className="h-3 w-3" /> PIN protected
                </span>
              </div>

              {/* Admin */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 mb-5">
                  <Building2 className="h-5 w-5" />
                </span>
                <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("role.admin.title")}</h3>
                <p className="mt-2.5 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {t("role.admin.desc")}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
                  <Lock className="h-3 w-3" /> PIN protected
                </span>
              </div>
            </div>
          </section>

          {/* ── ROLES ─────────────────────────────────────── */}
          <section id="roles" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Role-Based Access</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Choose your role
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
                Each role has a dedicated experience. Patient access is open. Doctor and admin workstations are PIN-protected.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Patient card */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-white p-6 sm:p-8 dark:border-emerald-500/30 dark:bg-zinc-900 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950">
                    <User className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("role.patient.title")}</h3>
                    <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">{t("role.patient.desc")}</p>
                  </div>
                </div>
                <div className="space-y-3 mb-7">
                  {["Register at kiosk in your language", "Describe symptoms by voice or text", "Receive OPD token and queue position"].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-base font-medium text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {item}
                    </div>
))}
                </div>
                <button
                  type="button"
                  onClick={handlePatientStart}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3.5 text-lg font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all duration-150 cursor-pointer dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 shadow-md shadow-emerald-600/20"
                >
                  <Mic className="h-5 w-5" />
                  {t("guide.startBtn")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Doctor card */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("role.doctor.title")}</h3>
                    <p className="mt-1 text-base text-zinc-600 dark:text-zinc-400">{t("role.doctor.desc")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {["Protected with PIN — staff only", "Review patient history before consultation", "Manage OPD queue in real time"].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-base font-medium text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                      {item}
                    </div>
))}
                </div>
              </div>
            </div>

            {/* Admin row */}
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white/70 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/70 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Building2 className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <div>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">Hospital Administration</p>
                  <p className="text-base text-zinc-600 dark:text-zinc-400">Protected operations dashboard for hospital administrators.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                <Lock className="h-4 w-4 text-zinc-400" /> PIN protected
              </span>
            </div>
          </section>

          {/* ── HOW IT WORKS ──────────────────────────────── */}
          <section id="how-it-works" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Patient Journey</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                How MediKiosk Works
              </h2>
            </div>

            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className={cn("reveal rounded-2xl border p-5 sm:p-6 flex items-start gap-5 transition-all hover:shadow-md", step.cardCls)}
                    style={{ "--i": i } }
                  >
                    <span className={cn("text-base font-black tracking-widest mt-0.5 shrink-0 w-6 tabular", step.numCls)}>
                      {step.number}
                    </span>
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", step.iconBg)}>
                      <Icon className={cn("h-5 w-5", step.iconCls)} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{step.title}</h3>
                      <p className="mt-1.5 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{step.desc}</p>
                    </div>
                  </div>
);
              })}
            </div>
          </section>

          {/* ── FEATURES ──────────────────────────────────── */}
          <section id="features" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Key Capabilities</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Features built for OPD intake
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="reveal rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
                    style={{ "--i": i % 6 } }
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 mb-4">
                      <Icon className="h-4.5 w-4.5 text-zinc-700 dark:text-zinc-300" />
                    </span>
                    <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">{f.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">{f.desc}</p>
                  </div>
);
              })}
            </div>
          </section>

          {/* ── WHY MEDIKIOSK ─────────────────────────────── */}
          <section className="py-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Why MediKiosk</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  From waiting-room paperwork to structured digital intake.
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
                  MediKiosk replaces fragmented OPD workflows with a structured, multilingual digital process — from first contact to consultation.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {VALUE_PROPS.map(prop => (
                  <div key={prop} className="flex items-start gap-3 text-base font-medium text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    {prop}
                  </div>
))}
              </div>
            </div>
          </section>

          {/* ── SECURITY ──────────────────────────────────── */}
          <section className="py-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="rounded-2xl border border-zinc-200 bg-white/60 p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center gap-4 mb-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Security</p>
                  <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Built with role-based access.</h3>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mb-5">
                {[
                  { label: "Patient", desc: "Open kiosk experience — no login required.", icon: User, open: true },
                  { label: "Doctor", desc: "Protected clinical workstation — PIN required.", icon: Stethoscope, open: false },
                  { label: "Hospital Admin", desc: "Protected operations dashboard — PIN required.", icon: Building2, open: false },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-700/80 dark:bg-zinc-800/70">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{item.label}</span>
                        </div>
                        {item.open
                          ? <span className="text-sm font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-full px-2.5 py-1">Open</span>
                          : <Lock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        }
                      </div>
                      <p className="text-base text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                    </div>
);
                })}
              </div>
              <p className="text-base font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-zinc-400 dark:text-zinc-600 shrink-0" />
                Clinical and operational screens remain protected from public kiosk users.
              </p>
            </div>
          </section>

          {/* ── CTA ───────────────────────────────────────── */}
          <section className="py-16 lg:py-20 border-t border-zinc-100 dark:border-zinc-900">
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60 p-8 sm:p-12 dark:border-emerald-500/30 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-teal-950/30">
              <div className="flex items-start sm:items-center gap-4 mb-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md dark:bg-emerald-500 dark:text-zinc-950">
                  <HeartHandshake className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Start your OPD journey with MediKiosk.
                  </h2>
                  <p className="mt-1.5 text-lg text-zinc-600 dark:text-zinc-400">
                    Register as a patient or access the protected clinical workspace.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handlePatientStart}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition-all duration-150 cursor-pointer dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                >
                  <Mic className="h-5 w-5" />
                  Patient Login
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

        </div>{/* /max-w-[1400px] */}
      </main>

      {/* ────────────────── FOOTER ────────────────── */}
      <footer className="border-t border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-display text-base font-bold text-white dark:bg-emerald-500 dark:text-zinc-950">M</span>
                <span className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">MediKiosk</span>
              </div>
              <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
                OPD intake & clinical documentation.<br />Smart Kiosk System for hospitals.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Product</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Home", action: () => scrollTo("home") },
                  { label: "How It Works", action: () => scrollTo("how-it-works") },
                  { label: "Features", action: () => scrollTo("features") },
                  { label: "Roles", action: () => scrollTo("roles") },
                ].map(item => (
                  <li key={item.label}>
                    <button type="button" onClick={item.action} className="text-base font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors cursor-pointer">
                      {item.label}
                    </button>
                  </li>
))}
              </ul>
            </div>

            {/* Access */}
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Access</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Patient Login", action: handlePatientStart },
                  { label: "Patient Sign Up", action: handlePatientStart },
                ].map(item => (
                  <li key={item.label}>
                    <button type="button" onClick={item.action} className="text-base font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors cursor-pointer">
                      {item.label}
                    </button>
                  </li>
))}
              </ul>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">MediKiosk — Smart OPD Kiosk System</p>
              <p className="text-base text-zinc-500 dark:text-zinc-500">Built for streamlined OPD intake and clinical documentation.</p>
            </div>
            <div className="flex items-center gap-2 text-base font-medium text-zinc-500 dark:text-zinc-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Patient kiosk open
            </div>
          </div>
        </div>
      </footer>
    </div>
);
}
