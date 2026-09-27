import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePatientStart = () => {
    if (setRole) setRole("patient");
    navigate("/patient");
  };

  const handleDoctorStart = () => {
    navigate("/doctor/dashboard");
  };

  const handleAdminStart = () => {
    navigate("/admin/dashboard");
  };

  return (
    <footer className="w-full bg-gradient-to-b from-[#064e3b] to-[#043d2e] text-white selection:bg-amber-500 selection:text-white border-t border-emerald-800/80">
      {/* Main Footer Container */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 pt-12 sm:pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1: Contact */}
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Contact
            </h3>

            <div>
              <h4 className="text-base font-bold text-white tracking-wide mb-1">
                Address
              </h4>
              <p className="text-sm text-emerald-100/95 leading-relaxed">
                MediKiosk Health Innovations<br />
                9th Floor, Jeevan Bharati Tower,<br />
                Connaught Place, New Delhi - 110 001
              </p>
            </div>

            <div>
              <h4 className="text-base font-bold text-white tracking-wide mb-1">
                Toll Free Number
              </h4>
              <a
                href="tel:1800114477"
                className="text-sm font-medium text-emerald-100 hover:text-white transition-colors"
              >
                1800-11-4477
              </a>
            </div>

            <div>
              <h4 className="text-base font-bold text-white tracking-wide mb-1">
                Email
              </h4>
              <a
                href="mailto:support@medikiosk.in"
                className="text-sm font-medium text-emerald-100 hover:text-white transition-colors"
              >
                support[at]medikiosk[dot]in
              </a>
            </div>

            <div>
              <h4 className="text-base font-bold text-white tracking-wide mb-2.5">
                Social Media
              </h4>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#1877F2] shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#FF0000] shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                {/* Twitter / X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#E4405F] shadow-sm hover:scale-105 active:scale-95 transition-transform"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Important Links (Direct MediKiosk Modules) */}
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Important Links
            </h3>

            <ul className="space-y-3.5 text-sm sm:text-base text-emerald-100">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <button
                  type="button"
                  onClick={handlePatientStart}
                  className="text-left hover:text-white hover:underline transition-colors leading-snug cursor-pointer"
                >
                  Smart OPD Intake & Voice Triage
                </button>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <button
                  type="button"
                  onClick={handlePatientStart}
                  className="text-left hover:text-white hover:underline transition-colors leading-snug cursor-pointer"
                >
                  Live OPD Queue & Token Tracking
                </button>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <button
                  type="button"
                  onClick={handleDoctorStart}
                  className="text-left hover:text-white hover:underline transition-colors leading-snug cursor-pointer"
                >
                  Doctor Consultation & EHR Desk
                </button>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <button
                  type="button"
                  onClick={handleAdminStart}
                  className="text-left hover:text-white hover:underline transition-colors leading-snug cursor-pointer"
                >
                  Hospital Admin & Department Analytics
                </button>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <button
                  type="button"
                  onClick={() => scrollToSection("pricing")}
                  className="text-left hover:text-white hover:underline transition-colors leading-snug cursor-pointer"
                >
                  Hospital Subscriptions & Kiosk Setup
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies (MediKiosk Healthcare Compliance) */}
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Policies
            </h3>

            <ul className="space-y-3.5 text-sm sm:text-base text-emerald-100">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <a
                  href="#terms"
                  className="hover:text-white hover:underline transition-colors leading-snug"
                >
                  Terms and Conditions
                </a>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <a
                  href="#privacy"
                  className="hover:text-white hover:underline transition-colors leading-snug"
                >
                  Patient Data Privacy & Consent Policy
                </a>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <a
                  href="#queue-policy"
                  className="hover:text-white hover:underline transition-colors leading-snug"
                >
                  OPD Queue & Token Allocation Policy
                </a>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="text-emerald-300 mt-1 text-sm font-bold">•</span>
                <a
                  href="#security"
                  className="hover:text-white hover:underline transition-colors leading-snug"
                >
                  Hospital Security & Data Encryption
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: MediKiosk App */}
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              MediKiosk App
            </h3>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-snug">
              Download the MediKiosk app{" "}
              <span className="italic font-light">(Bharat ka smart OPD partner)</span>
            </p>

            {/* QR Card + Instructions */}
            <div className="flex items-center gap-3.5 pt-1">
              {/* QR Code Container with MediKiosk Center Badge */}
              <div className="relative shrink-0 rounded-2xl bg-white p-2 sm:p-2.5 shadow-xl">
                <svg
                  className="h-24 w-24 sm:h-28 sm:w-28 text-slate-900"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer corner markers */}
                  <rect x="6" y="6" width="32" height="32" rx="4" stroke="#111827" strokeWidth="6" />
                  <rect x="15" y="15" width="14" height="14" rx="2" fill="#111827" />

                  <rect x="82" y="6" width="32" height="32" rx="4" stroke="#111827" strokeWidth="6" />
                  <rect x="91" y="15" width="14" height="14" rx="2" fill="#111827" />

                  <rect x="6" y="82" width="32" height="32" rx="4" stroke="#111827" strokeWidth="6" />
                  <rect x="15" y="91" width="14" height="14" rx="2" fill="#111827" />

                  {/* QR Data modules */}
                  <path
                    d="M48 10h6v6h-6zm14 0h6v6h-6zm0 14h6v6h-6zm-14 14h6v6h-6zm14 0h6v6h-6zm8 0h6v6h-6zm-36 8h6v6h-6zm20 8h6v6h-6zm-20 14h6v6h-6zm20 0h6v6h-6zm8 8h6v6h-6zm14-8h6v6h-6zm8 0h6v6h-6zm14-14h6v6h-6zm-8-14h6v6h-6zm14 0h6v6h-6zm-28 36h6v6h-6zm14 0h6v6h-6zm14 0h6v6h-6zm8 8h6v6h-6zm-8 8h6v6h-6zm14 0h6v6h-6zm-28 8h6v6h-6zm14 8h6v6h-6zm-36-8h6v6h-6zm0 14h6v6h-6z"
                    fill="#111827"
                  />

                  {/* Central MediKiosk Emblem Badge */}
                  <circle cx="60" cy="60" r="17" fill="white" />
                  <circle cx="60" cy="60" r="14" fill="#059669" />
                  {/* Medical Cross + M letter */}
                  <rect x="57" y="50" width="6" height="20" rx="2" fill="white" />
                  <rect x="50" y="57" width="20" height="6" rx="2" fill="white" />
                  <circle cx="60" cy="60" r="4.5" fill="#064e3b" />
                  <text
                    x="60"
                    y="63.5"
                    fill="white"
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    M
                  </text>
                </svg>
              </div>

              {/* Instructions + Orange Accent */}
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium text-white leading-tight">
                  Scan with your phone camera to install.
                </p>
                <div className="h-1 w-12 rounded-full bg-amber-400" />
              </div>
            </div>

            {/* Store Badges */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              {/* Google Play */}
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#043d2e] hover:bg-[#02281e] border border-emerald-400/25 px-3 py-2 transition-all shadow-md active:scale-95"
              >
                <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M3.609 1.813A1.5 1.5 0 0 0 3 3.109v17.782a1.5 1.5 0 0 0 .609 1.296l10.222-10.187z" fill="#00C1A6"/>
                  <path d="M17.433 15.602l-3.602-3.602-10.222 10.187c.465.253 1.051.222 1.527-.08z" fill="#FF3A44"/>
                  <path d="M17.433 8.398L5.136 1.897C4.66 1.595 4.074 1.564 3.609 1.817z" fill="#00E676"/>
                  <path d="M21.218 10.518l-3.785-2.12-3.602 3.602 3.602 3.602 3.785-2.12c1.042-.584 1.042-2.38 0-2.964z" fill="#FFD000"/>
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-200 leading-none">GET IT ON</p>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight">Google Play</p>
                </div>
              </a>

              {/* App Store */}
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-[#043d2e] hover:bg-[#02281e] border border-emerald-400/25 px-3 py-2 transition-all shadow-md active:scale-95"
              >
                <svg className="h-4.5 w-4.5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.65 1.37-.56.64-1.04 1.71-.92 2.74 1.05.08 2.06-.52 2.65-1.24z" />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-200 leading-none">Download on the</p>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight">App Store</p>
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright / compliance strip */}
        <div className="mt-14 pt-8 border-t border-emerald-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-emerald-200/80">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} MediKiosk · Smart OPD Intake & Hospital Management System.
          </p>
          <p className="text-center md:text-right text-emerald-300">
            HL7/FHIR Standardized · DISHA & ISO 27001 Compliant · All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
