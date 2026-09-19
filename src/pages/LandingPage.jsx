import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { AccessibilityToolbar } from "@/components/layout/AccessibilityToolbar";
import { logoutStaff } from "@/services/authService";
import { cn } from "@/utils/cn";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileCheck,
  FileText,
  Globe2,
  HeartHandshake,
  History,
  Landmark,
  Lock,
  MapPin,
  Menu,
  Mic,
  Moon,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Stethoscope,
  Ticket,
  User,
  Users,
  X,
} from "lucide-react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Home", action: "home" },
  { label: "About Us", action: "about-us" },
  { label: "Support", action: "support" },
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
    desc: "Patients interact with the kiosk in their preferred language (English, Hindi, Bengali, Marathi, Tamil, Telugu) with large touch targets.",
    cardCls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconCls: "text-emerald-700 dark:text-emerald-400",
    numCls: "text-emerald-600 dark:text-emerald-500",
  },
  {
    number: "02", icon: Mic,
    title: "Problem & Symptoms Intake",
    desc: "Patients describe chief complaints using voice recognition or category buttons in their own regional language.",
    cardCls: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconCls: "text-amber-700 dark:text-amber-400",
    numCls: "text-amber-600 dark:text-amber-500",
  },
  {
    number: "03", icon: MapPin,
    title: "Location & OPD Wing Selection",
    desc: "Patients confirm their clinic or OPD department location ensuring they are routed to the proper hospital facility.",
    cardCls: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconCls: "text-sky-700 dark:text-sky-400",
    numCls: "text-sky-600 dark:text-sky-500",
  },
  {
    number: "04", icon: Stethoscope,
    title: "Related Doctors & Clinician Selection",
    desc: "Browse matching specialists with real-time room numbers, availability, qualifications, and consultation details.",
    cardCls: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50",
    iconBg: "bg-teal-100 dark:bg-teal-900/50",
    iconCls: "text-teal-700 dark:text-teal-400",
    numCls: "text-teal-600 dark:text-teal-500",
  },
  {
    number: "05", icon: User,
    title: "Quick Patient Registration",
    desc: "Enter patient name, age, biological sex, phone number, and optional ABHA ID / UHID for hospital records.",
    cardCls: "bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800",
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconCls: "text-zinc-700 dark:text-zinc-300",
    numCls: "text-zinc-500 dark:text-zinc-400",
  },
  {
    number: "06", icon: History,
    title: "Structured Medical History",
    desc: "Capture existing conditions (Diabetes, Hypertension), ongoing medications, drug allergies, and duration.",
    cardCls: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    iconCls: "text-indigo-700 dark:text-indigo-400",
    numCls: "text-indigo-600 dark:text-indigo-500",
  },
  {
    number: "07", icon: FileText,
    title: "Upload & OCR Document Scanning",
    desc: "Scan previous prescriptions and lab reports directly at the kiosk with in-browser Tesseract OCR text extraction.",
    cardCls: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconCls: "text-purple-700 dark:text-purple-400",
    numCls: "text-purple-600 dark:text-purple-500",
  },
  {
    number: "08", icon: FileCheck,
    title: "Structured Patient Summary",
    desc: "Review a comprehensive intake summary on the kiosk screen before confirming and generating the OPD token.",
    cardCls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconCls: "text-emerald-700 dark:text-emerald-400",
    numCls: "text-emerald-600 dark:text-emerald-500",
  },
  {
    number: "09", icon: Ticket,
    title: "Live OPD Token & Queue Tracking",
    desc: "Receive an OPD token number with live waiting position and estimated consultation time.",
    cardCls: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/50",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    iconCls: "text-cyan-700 dark:text-cyan-400",
    numCls: "text-cyan-600 dark:text-cyan-500",
  },
  {
    number: "10", icon: CheckCircle2,
    title: "Doctor Consultation & Follow-up",
    desc: "Doctor reviews pre-consultation clinical snapshot and medical timeline, records clinical notes, and assigns a follow-up plan.",
    cardCls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/60",
    iconCls: "text-emerald-700 dark:text-emerald-400",
    numCls: "text-emerald-600 dark:text-emerald-500",
  },
];

const VALUE_PROPS = [
  "Hospital first-mile platform: connects problem, doctor routing, and clinical intake",
  "Capture structured patient history and allergies before consultation begins",
  "OCR document digitization directly at the kiosk terminal",
  "Doctors receive organized clinical snapshots, previous reports, and medical timelines",
  "Zero referral commissions: purely ethical clinical decision support and workflow",
  "Live token queue management with real-time room pace tracking",
  "B2B hospital subscription model — basic kiosk usage is 100% free for patients",
  "Role-based workstation security separating public kiosks from clinical records",
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

  const handleNavClick = (link) => {
    setMobileMenuOpen(false);
    if (link.action === "home") {
      scrollTo("home");
    } else if (link.action === "about-us") {
      scrollTo("about-us");
    } else if (link.action === "support") {
      scrollTo("support");
    }
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
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-2xl saturate-150 dark:border-zinc-800 dark:bg-zinc-950/95 shadow-sm">
        {/* Top Accessibility Strip — Positioned above Nav Bar & Login Buttons */}
        <div className="border-b border-zinc-200/80 bg-zinc-50/95 dark:border-zinc-800/80 dark:bg-zinc-900/80 py-1 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">National Health Mission · OPD Kiosk System</span>
              <span className="sm:hidden">MediKiosk Portal</span>
            </div>
            <AccessibilityToolbar variant="strip" />
          </div>
        </div>

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
                onClick={() => handleNavClick(link)}
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
                onClick={() => handleNavClick(link)}
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
            <div className="reveal mt-8 flex flex-wrap items-center gap-1.5 sm:gap-2"
              style={{ "--i": 3 } }
            >
              {[
                "Language",
                "Problem",
                "Location",
                "Doctor",
                "Registration",
                "History",
                "Documents",
                "Summary",
                "OPD Token",
                "Consultation",
              ].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-1.5 sm:gap-2">
                  <span className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    {step}
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />}
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

          {/* ── DOCTOR WORKFLOW & RETENTION ────────────────── */}
          <section id="doctor-workflow" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-800 dark:border-teal-500/40 dark:bg-teal-950/60 dark:text-teal-300 mb-3">
                <Stethoscope className="h-3.5 w-3.5" />
                Doctor-Centric Design · Clinical Integrity
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Designed for Doctors. Zero Commissions.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
                MediKiosk delivers clinical value through workflow efficiency and structured pre-intake patient context — never through referral fees, test kickbacks, or pharmacy markups.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 mb-5">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Pre-Consultation Snapshot</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Review chief complaints, ongoing medications, drug allergies, and OCR-digitized past reports before calling the patient.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 mb-5">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Chronological Medical Timeline</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Visual year-by-year history tree connecting past visits, blood reports, prescriptions, and follow-ups in a single glance.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Ethical Healthcare Policy</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  No referral commissions for diagnostic tests or medicines. Doctors retain 100% diagnostic autonomy without algorithmic diagnosis claims.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 mb-5">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Queue State Control</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Four-stage state machine: WAITING → CALL PATIENT → START CONSULTATION → COMPLETE CONSULTATION with live room pace.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 mb-5">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Integrated Follow-up Tracking</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Record clinician notes, schedule follow-up visit dates, and provide patient instructions saved directly into audit trails.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 mb-5">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Isolated Clinician Sessions</h3>
                <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  PIN-secured doctor portal automatically locks when navigating to public screens, preserving patient privacy at shared kiosks.
                </p>
              </div>
            </div>
          </section>

          {/* ── ABOUT US ──────────────────────────────────── */}
          <section id="about-us" className="py-16 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">About Us</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  About MediKiosk · Hospital First-Mile Platform
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
                  MediKiosk replaces fragmented OPD workflows with a structured, multilingual digital process — connecting patients directly to the right department and doctor before consultation begins.
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

          {/* ── PRICING & HOSPITAL BUSINESS MODEL (DEMO) ────── */}
          <section id="pricing" className="py-16 lg:py-20 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-300 mb-3">
                <AlertCircle className="h-3.5 w-3.5" />
                Proposed B2B Model · Demonstration Only
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Transparent Hospital Subscription
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-3xl">
                MediKiosk is designed as a B2B platform for hospitals and health networks. Basic kiosk registration and token tracking is 100% free for all patients. No real payments are processed on this demonstration platform.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tier 1: FREE / DEMO */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 p-6 flex flex-col justify-between dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <div>
                  <span className="inline-flex rounded-md bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-3">
                    Open / Demo Access
                  </span>
                  <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Free / Demo</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">₹0</span>
                    <span className="text-sm font-semibold text-zinc-500">/ free for patients</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Basic kiosk intake and demo testing.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 1 Kiosk terminal</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Basic patient registration</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Problem selection & triage</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Location-based routing</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Doctor discovery</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Basic OPD queue token</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handlePatientStart}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
                  >
                    Try Patient Kiosk
                  </button>
                </div>
              </div>

              {/* Tier 2: STARTER */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                    Small Clinics & OPDs
                  </span>
                  <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Starter</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">₹1,499</span>
                    <span className="text-sm font-semibold text-zinc-500">/ mo (Proposed)</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Low-cost deployment for standalone clinics.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> 1-2 Kiosk Terminals</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Patient registration flow</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Doctor & queue management</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Structured patient history</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Document & OCR scanning</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <span className="block text-center text-xs font-medium text-zinc-400">Proposed / Demo Pricing</span>
                </div>
              </div>

              {/* Tier 3: HOSPITAL */}
              <div className="relative rounded-2xl border-2 border-zinc-900 bg-white p-6 flex flex-col justify-between dark:border-zinc-100 dark:bg-zinc-900 shadow-md">
                <span className="absolute -top-3 right-4 rounded-full bg-zinc-900 dark:bg-white px-3 py-0.5 text-xs font-bold text-white dark:text-zinc-950">
                  Popular
                </span>
                <div>
                  <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                    Medium / Large Hospitals
                  </span>
                  <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Hospital</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">₹4,999</span>
                    <span className="text-sm font-semibold text-zinc-500">/ mo (Proposed)</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Multi-department OPD floor management.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Multiple Kiosks support</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> All OPD departments</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Doctor dashboard & timeline</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Patient records & audit log</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Hospital analytics & status</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Maintenance & support</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <span className="block text-center text-xs font-medium text-zinc-400">Proposed / Demo Pricing</span>
                </div>
              </div>

              {/* Tier 4: ENTERPRISE */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3">
                    Hospital Chains & Networks
                  </span>
                  <h3 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Enterprise</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">Custom</span>
                    <span className="text-sm font-semibold text-zinc-500">/ SLA (Proposed)</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    Chains with multiple facilities & branches.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Multiple hospital locations</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Fleet-wide kiosk sync</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Custom EHR/HIS integrations</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> Dedicated SLA support</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-zinc-500" /> On-site hardware maintenance</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <span className="block text-center text-xs font-medium text-zinc-400">Proposed / Demo Pricing</span>
                </div>
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

          {/* ── SUPPORT ────────────────────────────────────── */}
          <section id="support" className="py-16 scroll-mt-16 border-t border-zinc-100 dark:border-zinc-900">
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Assistance & Help</p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  MediKiosk Support & Assistance
                </h2>
                <p className="mt-3 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
                  Need assistance with your OPD token, multilingual voice input, or kiosk terminal? Hospital support staff and telemetry are available 24/7.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-700/70 dark:bg-zinc-800/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 mb-4">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">OPD Helpdesk Counter</h3>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Ground floor main reception & OPD kiosk desk. Staff extension 1042 available during clinic hours.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-700/70 dark:bg-zinc-800/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 mb-4">
                    <Mic className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Multilingual Voice Support</h3>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Supports speaking chief complaints in English, Hindi, Bengali, Marathi, Tamil, and Telugu.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-700/70 dark:bg-zinc-800/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">Kiosk Privacy & Telemetry</h3>
                  <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                    Automated idle timeout clears screens for public corridor privacy; 24/7 hardware telemetry active.
                  </p>
                </div>
              </div>
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
                  { label: "Patient Flow", action: () => scrollTo("how-it-works") },
                  { label: "Doctor Workflow", action: () => scrollTo("doctor-workflow") },
                  { label: "Features", action: () => scrollTo("features") },
                  { label: "Pricing (Demo)", action: () => scrollTo("pricing") },
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
