import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getToken } from "@/services/patientService";

import { ArrowRight, CheckCircle2, Clock, ListOrdered, Timer, Building2, Stethoscope, Printer, User, ShieldCheck, DoorOpen } from "lucide-react";

export default function TokenPage() {
  const navigate = useNavigate();
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getToken().then(t => {
      if (alive) {
        setToken(t);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [tokenId]);

  if (loading || !token) {
    return (
      <KioskLayout title="Your OPD Token" step={{ current: 4, total: 9, label: "Token" }}>
        <Skeleton className="h-[280px] w-full rounded-[18px]" />
      </KioskLayout>
);
  }

  return (
    <KioskLayout
      title="OPD Token Confirmed"
      intro="Your consultation token is generated. Please see your token number and room details below."
      step={{ current: 4, total: 9, label: "Token" }}
      aside={<Badge tone="solid" mark="dot">Token Active</Badge>}
    >
      {/* Confirmation Top Banner */}
      <div className="mb-4 flex items-center gap-3 rounded-[14px] border border-emerald-500/40 bg-emerald-50/80 p-3.5 text-left dark:border-emerald-500/30 dark:bg-emerald-950/40">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold dark:bg-emerald-500 dark:text-zinc-950">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
            Token Confirmed & Registered in Doctor's Queue
          </p>
          <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-400">
            SMS sent to registered mobile number · No private health data shown on public screens.
          </p>
        </div>
      </div>

      {/* Main Digital Token Slip Card */}
      <div className="overflow-hidden rounded-[20px] border-2 border-emerald-500/40 bg-white shadow-xl dark:border-emerald-500/30 dark:bg-zinc-900 text-left">
        {/* Giant High-Contrast Token Display */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-7 text-white dark:from-emerald-700 dark:to-teal-800">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold uppercase tracking-widest text-white backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" /> OPD TOKEN NUMBER
            </span>
            <span className="text-sm font-semibold text-emerald-100">
              Issued: {token.generatedAt}
            </span>
          </div>

          {/* Huge, Unmissable Token Number */}
          <div className="my-3 text-center sm:text-left">
            <p className="font-mono text-7xl font-black leading-none tracking-wider text-white drop-shadow-md sm:text-7xl">
              {token.number}
            </p>
          </div>

          {/* Department & Hospital info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/20 pt-3 text-base font-semibold text-white/90">
            <span className="flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-emerald-200" />
              {token.department} Department
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-emerald-200" />
              {token.hospitalName}
            </span>
          </div>
        </div>

        {/* Assigned Doctor & Patient Information */}
        <div className="grid border-b border-zinc-200 p-4.5 dark:border-zinc-800 sm:grid-cols-2 gap-3.5 bg-zinc-50/70 dark:bg-zinc-950/40">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-base dark:bg-emerald-950 dark:text-emerald-300">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Assigned Doctor
              </p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                {token.doctorName}
              </p>
              <p className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <DoorOpen className="h-3.5 w-3.5" />
                Report to Room 204 (OPD Floor)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-200 text-zinc-800 font-bold text-base dark:bg-zinc-800 dark:text-zinc-200">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Patient Registered
              </p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                {token.patientName || "Walk-in Patient"}
              </p>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                Age: {token.age || 35} yrs · Sex: {token.sex || "F"}
              </p>
            </div>
          </div>
        </div>

        {/* Live Queue Status 3-Column Metrics */}
        <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="p-4 text-center">
            <ListOrdered className="mx-auto h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-1.5 text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Now Serving
            </p>
            <p className="font-mono text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 mt-0.5">
              {token.currentServing}
            </p>
          </div>

          <div className="p-4 text-center bg-emerald-50/30 dark:bg-emerald-950/20">
            <ArrowRight className="mx-auto h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-1.5 text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Patients Ahead
            </p>
            <p className="font-mono text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {token.patientsAhead}
            </p>
          </div>

          <div className="p-4 text-center">
            <Clock className="mx-auto h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            <p className="mt-1.5 text-sm font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Est. Call Time
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">
              {token.estimatedTime}
            </p>
          </div>
        </div>

        {/* Bottom arrival instruction */}
        <div className="flex items-center justify-between gap-3 bg-zinc-50 p-4 dark:bg-zinc-950/60">
          <p className="flex items-center gap-2 text-base font-bold text-zinc-800 dark:text-zinc-200">
            <Timer className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Please reach OPD Waiting Area by {token.recommendedArrival}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-zinc-300 bg-white px-3 py-1.5 text-sm font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Slip
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate(`/patient/queue/${token.id}`)}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-emerald-600 px-6 py-4 text-lg font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition-all duration-150 cursor-pointer dark:bg-emerald-500 dark:text-zinc-950"
        >
          <span>Watch Live Queue Status</span>
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/patient/history")}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] border-2 border-zinc-300 bg-white px-6 py-4 text-lg font-extrabold text-zinc-800 hover:border-emerald-400 hover:bg-zinc-50 active:scale-95 transition-all duration-150 cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <span>Pre-fill Medical History (Optional)</span>
        </button>
      </div>
    </KioskLayout>
);
}
