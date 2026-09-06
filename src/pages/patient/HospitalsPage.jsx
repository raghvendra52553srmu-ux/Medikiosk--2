import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useApp } from "@/context/AppContext";

import { readFacilitySession } from "@/services/hospitalService";
import { fetchFacilities } from "@/services/geoService";

import { HospitalTypeBadge, HospitalIllustration } from "@/components/kiosk/HospitalTypeVisual";
import { ArrowRight, Clock, Footprints, MapPin, Navigation, Phone, RefreshCw, Siren } from "lucide-react";
import { cn } from "@/utils/cn";

const statusCopy = {
  open: { label: "hosp.open", mark: "dot", tone: "solid" },
  "closing-soon": { label: "hosp.closing", mark: "dot", tone: "flag" },
  closed: { label: "hosp.closed", mark: "ring", tone: "quiet" },
  unknown: { label: "hosp.unknown", mark: "ring", tone: "neutral" },
};

export default function FacilitiesPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async (mode) => {
    if (mode === "session") {
      const cached = readFacilitySession();
      if (cached) {
        setSession(cached);
        setLoading(false);
        return;
      }
    }
    const cached = readFacilitySession();
    if (!cached) { navigate("/patient/location"); return; }
    mode === "refresh" ? setRefreshing(true) : setLoading(true);
    try {
      const fresh = await fetchFacilities(cached.center);
      setSession(fresh);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => { void load("session"); }, [load]);

  const list = useMemo(() => {
    const items = session?.hospitals ?? [];
    if (filter === "open") {
      return items.filter(h => h.opdStatus === "open" || h.opdStatus === "closing-soon");
    }
    if (filter === "gov") {
      return items.filter(h => {
        const norm = (h.type + " " + h.name).toLowerCase();
        return norm.includes("gov") || norm.includes("district") || norm.includes("civil") || norm.includes("zilla") || norm.includes("municipal") || norm.includes("aiims") || norm.includes("esic");
      });
    }
    if (filter === "pvt") {
      return items.filter(h => {
        const norm = (h.type + " " + h.name).toLowerCase();
        return norm.includes("pvt") || norm.includes("private") || norm.includes("ltd") || norm.includes("clinic") || norm.includes("specialty") || (!norm.includes("gov") && !norm.includes("district") && !norm.includes("civil"));
      });
    }
    return items;
  }, [session, filter]);

  if (loading) {
    return (
      <KioskLayout title={t("hosp.title")} intro={t("loc.fetching")} step={{ current: 5, total: 10, label: "Facility" }}>
        <SkeletonList count={4} />
      </KioskLayout>
);
  }

  if (!session) return null;

  const openCount = session.hospitals.filter(h => h.opdStatus === "open" || h.opdStatus === "closing-soon").length;

  return (
    <KioskLayout
      title={t("hosp.title")}
      intro={t("hosp.helper")}
      step={{ current: 5, total: 10, label: "Facility" }}
      aside={
        <Badge tone="outline" mark="dot" className="hidden md:inline-flex">
          <Navigation className="h-3 w-3" />
          {session.place?.label ?? "Live position"} · {session.radiusUsed / 1000} km
        </Badge>
      }
    >
      {/* Result summary bar — density without decoration */}
      <div className="glass-strong -mt-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[13px] px-4 py-3">
        <p className="text-base text-ink/70">
          <span className="tabular font-display text-xl font-semibold text-ink">{session.hospitals.length}</span>{" "}
          facilities mapped
        </p>
        <span className="hidden h-4 w-px bg-ink/12 sm:block" />
        <p className="text-base text-ink/55">{openCount} with OPD hours open right now</p>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-[9px] border border-line bg-white/55 dark:bg-zinc-900/60 p-0.5">
            {[
              { id: "all", label: "All" },
              { id: "gov", label: "Govt" },
              { id: "pvt", label: "Private" },
              { id: "open", label: "Open now" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-[9px] px-3 py-1.5 text-sm sm:text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer",
                  filter === f.id
                    ? "bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950"
                    : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:text-white"
)}
              >
                {f.label}
              </button>
))}
          </div>
          <button
            onClick={() => void load("refresh")}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-[9px] border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold text-zinc-800 transition-all hover:border-emerald-400 hover:text-emerald-600 active:scale-95 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {failed && (
        <div className="mb-3 flex items-start gap-3 rounded-[13px] border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full border border-red-500 bg-red-500" />
          <div className="flex-1 text-left">
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{t("hosp.errorTitle")}</p>
            <p className="mt-0.5 text-base text-zinc-600 dark:text-zinc-400">{t("hosp.errorBody")} Showing the last result read on this device.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void load("refresh")}>{t("common.retry")}</Button>
        </div>
)}

      {session.widened && session.hospitals.length > 0 && (
        <p className="mb-3 text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
          Nothing was mapped within 15 km, so the search was widened to 20 km.
        </p>
)}

      {list.length === 0 ? (
        <EmptyState
          tone="alert"
          icon={<MapPin className="h-5 w-5" />}
          title={t("hosp.emptyTitle")}
          description={t("hosp.emptyBody")}
          action={
            <Button size="md" onClick={() => navigate("/patient/location")} icon={<Navigation className="h-4 w-4" />}>
              {t("hosp.reset")}
            </Button>
          }
          secondaryAction={
            session.hospitals.length > 0 ? (
              <Button size="md" variant="tertiary" onClick={() => setFilter("all")}>Show all {session.hospitals.length}</Button>
) : undefined
          }
        />
) : (
        <ul className="space-y-3">
          {list.map((h, i) => {
            const s = statusCopy[h.opdStatus];
            return (
              <li
                key={h.id}
                className="reveal"
                style={{ ["--i" ]: Math.min(i, 8) }}
              >
                <button
                  onClick={() => navigate(`/patient/hospital/${h.id}`)}
                  className="group block w-full rounded-[16px] border-2 border-zinc-200 bg-white text-left shadow-xs transition-all duration-150 hover:border-emerald-500 hover:shadow-md active:scale-[0.98] active:border-emerald-600 active:ring-2 active:ring-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-400 cursor-pointer"
                >
                  {/* Subtle Hospital Illustration Banner */}
                  <div className="p-3 pb-0">
                    <HospitalIllustration type={h.type} name={h.name} variant="compact" />
                  </div>

                  <div className="p-4 sm:p-5 pt-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="tabular font-mono text-sm text-ink/60">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <h3 className="font-display text-lg md:text-xl font-semibold leading-snug tracking-[-0.02em] text-ink">
                            {h.name}
                          </h3>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <HospitalTypeBadge type={h.type} />
                          {h.address !== "Address not mapped" && (
                            <span className="text-sm text-ink/60 truncate max-w-xs">
                              {h.address}
                            </span>
)}
                        </div>
                      </div>
                      <Badge tone={s.tone} mark={s.mark} className="shrink-0">{t(s.label)}</Badge>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line/80 pt-3 text-sm sm:text-base text-ink/65">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <Navigation className="h-3.5 w-3.5 text-ink/60" />
                        {h.distanceLabel} <span className="font-normal text-ink/60">{t("hosp.away")}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Footprints className="h-3.5 w-3.5 text-ink/60" />
                        {h.walkMinutes} min walk
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-ink/60" />
                        <span className="truncate">{h.opdTiming}</span>
                      </span>
                      {h.closesAt && h.opdStatus !== "unknown" && (
                        <span className="text-ink/60">{t("common.closesAt")} {h.closesAt}</span>
)}
                      {h.emergency && <Badge tone="flag">24h emergency</Badge>}
                    </div>

                    {h.specialities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {h.specialities.slice(0, 4).map(spc => (
                          <span key={spc} className="rounded-md border border-line bg-white/60 dark:bg-white/[0.06] px-2 py-[3px] text-sm text-ink/65 dark:text-zinc-300">
                            {spc}
                          </span>
))}
                        {h.specialities.length > 4 && (
                          <span className="px-1 py-[3px] text-sm text-ink/60">
                            +{h.specialities.length - 4} {t("hosp.more")}
                          </span>
)}
                      </div>
)}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-line/80 bg-ink/[0.02] dark:bg-white/[0.02] px-4 py-2.5 sm:px-5">
                    <span className="flex min-w-0 items-center gap-2 text-sm text-ink/60">
                      {h.phone ? (
                        <>
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-mono">{h.phone}</span>
                        </>
) : (
                        <>
                          <Siren className="h-3.5 w-3.5 shrink-0" />
                          Number not mapped
                        </>
)}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-sm sm:text-base font-medium text-ink">
                      OPD &amp; doctors
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[420ms] [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              </li>
);
          })}
        </ul>
)}
    </KioskLayout>
);
}
