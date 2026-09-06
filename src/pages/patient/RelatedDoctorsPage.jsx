import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { readClinic, saveClinic } from "@/services/patientService";
import { readFacilitySession } from "@/services/hospitalService";
import { getDoctors } from "@/services/doctorService";
import { useQuery } from "@tanstack/react-query";
import { errorMessage } from "@/services/apiClient";
import { Skeleton } from "@/components/ui/Skeleton";

import {
  ArrowRight,
  Building2,
  Clock,
  Navigation,
  Stethoscope,
  Users,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/cn";

export default function RelatedDoctorsPage() {
  const navigate = useNavigate();

  // Read the problem & department chosen in Step 1
  const clinic = useMemo(() => readClinic(), []);
  // Read location & facilities fetched in Step 2
  const facilitySession = useMemo(() => readFacilitySession(), []);

  const [activeDept, setActiveDept] = useState(
    clinic.department || "General Medicine"
);

  /**
   * No invented fallback facility. The prototype substituted a fictional
   * "District Civil Hospital" when geolocation had not run — which would send a
   * real patient to a place that does not exist. If no facility has been chosen
   * we send them back to pick one.
   */
  const hospitals = useMemo(
    () => facilitySession?.hospitals ?? [],
    [facilitySession]
);

  // Nearby facilities are queried in parallel; each returns its real roster.
  const rosterQuery = useQuery({
    queryKey: ["related-doctors", activeDept, hospitals.map(h => h.id).join(",")],
    enabled: hospitals.length > 0,
    queryFn: async () => {
      // Cap the fan-out: the three closest facilities are enough to choose from
      // and keeps the kiosk responsive on a slow connection.
      const nearest = [...hospitals].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999)).slice(0, 3);

      const results = await Promise.allSettled(
        nearest.map(async hosp => {
          const docs = await getDoctors(hosp, { department: activeDept });
          return docs.map(d => ({ ...d, hospital: hosp }));
        })
);

      // One unreachable facility must not blank the whole list.
      return results.flatMap(r => (r.status === "fulfilled" ? r.value : []));
    },
  });

  const relatedDoctors = useMemo(() => {
    const list = [...(rosterQuery.data ?? [])];
    // Available first, then closest, then shortest queue.
    list.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      const distA = a.hospital.distanceKm ?? 999;
      const distB = b.hospital.distanceKm ?? 999;
      if (distA !== distB) return distA - distB;
      return a.queueSize - b.queueSize;
    });
    return list;
  }, [rosterQuery.data]);

  const handleSelectDoctor = (doc) => {
    saveClinic({
      hospitalId: doc.hospital.id,
      hospitalName: doc.hospital.name,
      doctorId: doc.id,
      doctorName: doc.name,
      department: doc.department,
    });

    // Continue to Step 6: Existing Registration Flow (Consent -> Registration -> History -> Documents -> Review -> Token)
    navigate("/patient/consent");
  };

  return (
    <KioskLayout
      title="Related Doctors"
      intro="Doctors matching your problem and location. Select a doctor to continue with your registration."
      step={{ current: 3, total: 8, label: "Doctor" }}
      aside={
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
            {relatedDoctors.length} available
          </span>
        </div>
      }
    >
      {/* Problem & Location Context Bar */}
      <div className="mb-5 rounded-[16px] border border-emerald-500/40 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/40 text-left shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold dark:bg-emerald-500 dark:text-zinc-950 shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Matched Department: {activeDept}
              </p>
              <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Problem: {clinic.problemText || "Symptoms evaluation"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/patient/problem")}
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline cursor-pointer"
            >
              Change Problem
            </button>
            <span className="text-zinc-300 dark:text-zinc-600">•</span>
            <button
              type="button"
              onClick={() => navigate("/patient/location")}
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline cursor-pointer"
            >
              Change Location
            </button>
          </div>
        </div>
      </div>

      {/* Doctor Cards List */}
      {hospitals.length === 0 ? (
        <div className="py-8">
          <EmptyState
            tone="alert"
            icon={<AlertCircle className="h-6 w-6" />}
            title="Choose a hospital first"
            description="We need to know which facility you can reach before we can show the doctors on duty there today."
            action={
              <Button size="lg" onClick={() => navigate("/patient/location")}>
                Find hospitals near me
              </Button>
            }
          />
        </div>
) : rosterQuery.isLoading ? (
        <div className="space-y-3.5" aria-busy="true" aria-live="polite">
          <span className="sr-only">Finding doctors near you…</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] w-full rounded-[16px]" />
))}
        </div>
) : rosterQuery.isError ? (
        <div className="py-8">
          <EmptyState
            tone="alert"
            icon={<AlertCircle className="h-6 w-6" />}
            title="Could not load doctors"
            description={errorMessage(rosterQuery.error)}
            action={
              <Button size="lg" onClick={() => void rosterQuery.refetch()}>
                Try again
              </Button>
            }
          />
        </div>
) : relatedDoctors.length === 0 ? (
        <div className="py-8">
          <EmptyState
            tone="alert"
            icon={<AlertCircle className="h-6 w-6" />}
            title="No related doctors found for your selected problem and location."
            description="No specialists are currently scheduled for this department in your area today. You can consult a General Medicine doctor or choose another hospital location."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="secondary" size="lg" onClick={() => navigate("/patient/location")}>
                  Change Location
                </Button>
                <Button size="lg" onClick={() => setActiveDept("General Medicine")}>
                  See General Medicine Doctors
                </Button>
              </div>
            }
          />
        </div>
) : (
        <div className="space-y-3.5 text-left">
          {relatedDoctors.map((doc, idx) => (
            <div
              key={`${doc.hospital.id}-${doc.id}`}
              className={cn(
                "group rounded-[16px] border-2 p-5 shadow-xs transition-all duration-150 hover:shadow-md active:scale-[0.99]",
                doc.available
                  ? "border-zinc-200 bg-white hover:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-400"
                  : "border-zinc-200 bg-zinc-50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900/60"
)}
              style={{ ["--i" ]: idx }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Doctor Avatar & Information */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-100 font-extrabold text-emerald-900 text-lg dark:bg-emerald-950/80 dark:text-emerald-200 shadow-xs">
                    {doc.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {doc.name}
                      </h3>
                      <Badge tone={doc.available ? "solid" : "quiet"} mark={doc.available ? "dot" : "ring"}>
                        {doc.available ? "Taking tokens" : "OPD closed"}
                      </Badge>
                    </div>

                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {doc.specialty}
                    </p>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 truncate">
                      {doc.qualification}
                    </p>

                    {/* Hospital & Proximity Tag */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm sm:text-base font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                        <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        {doc.hospital.name}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Navigation className="h-3.5 w-3.5" />
                        {doc.hospital.distanceLabel || `${doc.hospital.distanceKm} km`} away
                      </span>
                      <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        {doc.opdTiming}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold">
                        <Users className="h-3.5 w-3.5" />
                        {doc.queueSize} waiting (~{doc.estimatedWait})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Select Doctor Button */}
                <button
                  type="button"
                  disabled={!doc.available}
                  onClick={() => handleSelectDoctor(doc)}
                  className={cn(
                    "w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 rounded-[12px] px-6 py-3.5 text-base font-extrabold shadow-md transition-all duration-150 active:scale-95 cursor-pointer",
                    doc.available
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600 shadow-none"
)}
                >
                  <span>Select Doctor</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>
))}
        </div>
)}
    </KioskLayout>
);
}
