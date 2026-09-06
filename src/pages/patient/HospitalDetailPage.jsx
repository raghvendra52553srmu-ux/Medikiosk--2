import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFacility, facilityMapUrl } from "@/services/hospitalService";
import { getDepartments } from "@/services/doctorService";
import { dbIdFor } from "@/services/hospitalService";
import { errorMessage } from "@/services/apiClient";
import { Skeleton } from "@/components/ui/Skeleton";
import { qk } from "@/lib/queryClient";
import { directionsLink, openStreetMapLink } from "@/services/geoService";
import { HospitalTypeBadge, HospitalIllustration } from "@/components/kiosk/HospitalTypeVisual";
import { ArrowRight, Clock, ExternalLink, MapPin, Phone, Stethoscope } from "lucide-react";
import { cn } from "@/utils/cn";

export default function HospitalDetailPage() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const hospital = useMemo(() => getFacility(hospitalId), [hospitalId]);
  const [showMap, setShowMap] = useState(false);

  if (!hospital) {
    return (
      <KioskLayout title="Facility not available" step={{ current: 5, total: 10, label: "Facility" }}>
        <EmptyState
          tone="alert"
          icon={<MapPin className="h-5 w-5" />}
          title="This facility is no longer in the search result"
          description="The list was refreshed since you opened it. Pick a hospital again from the nearby list."
          action={<Button size="lg" onClick={() => navigate("/patient/hospitals")}>Back to nearby hospitals</Button>}
        />
      </KioskLayout>
);
  }

  // Selecting this facility provisions and returns its real department roster.
  const deptQuery = useQuery({
    queryKey: qk.departments(dbIdFor(hospital.id) ?? hospital.id),
    queryFn: () => getDepartments(hospital),
  });
  const departments = deptQuery.data ?? [];
  const statusLabel =
    hospital.opdStatus === "open" ? "Open now"
    : hospital.opdStatus === "closing-soon" ? "Closing soon"
    : hospital.opdStatus === "closed" ? "Closed now"
    : "Hours not listed";

  return (
    <KioskLayout
      title={hospital.name}
      step={{ current: 5, total: 10, label: "Facility" }}
      aside={<Badge tone="outline" mark="dot">{statusLabel}</Badge>}
      stickyFooter={
        <div className="flex items-center gap-2.5">
          <Button
            size="kiosk"
            className="flex-1"
            onClick={() => navigate(`/patient/department/${hospital.id}`)}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Continue to department
          </Button>
          <a
            href={directionsLink(hospital)}
            target="_blank"
            rel="noreferrer noopener"
            className="glass flex h-14 shrink-0 items-center gap-2 rounded-[12px] px-4 text-base font-medium text-ink transition-all duration-[320ms] [transition-timing-function:var(--ease-glide)] hover:bg-white/85 dark:hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Directions
          </a>
        </div>
      }
    >
      {/* Visual Government / Private Hospital Hero Illustration */}
      <div className="reveal mb-4">
        <HospitalIllustration type={hospital.type} name={hospital.name} variant="hero" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass-strong space-y-4 rounded-[16px] p-5">
          <div className="flex items-center gap-2">
            <HospitalTypeBadge type={hospital.type} size="md" />
            <span className="text-sm text-ink/60">Verified healthcare facility</span>
          </div>

          <div className="flex items-start gap-2.5 text-base leading-relaxed text-ink/70">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
            <span>{hospital.address}</span>
          </div>
          <div className="flex items-start gap-2.5 text-base text-ink/70">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink/60" />
            <div>
              <p>{hospital.opdTiming}</p>
              <p className="mt-0.5 text-sm text-ink/60">
                Opening hours as mapped by the community. The OPD desk is the authority on today's timings.
              </p>
            </div>
          </div>
          {hospital.phone && (
            <div className="flex items-center gap-2.5 text-base">
              <Phone className="h-4 w-4 shrink-0 text-ink/60" />
              <a href={`tel:${hospital.phone.replace(/\s/g, "")}`} className="font-mono text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                {hospital.phone}
              </a>
            </div>
)}

          <dl className="grid grid-cols-3 gap-3 border-t border-line pt-4">
            {[
              { k: "Distance", v: hospital.distanceLabel },
              { k: "On foot", v: `${hospital.walkMinutes} min` },
              { k: "Governance", v: hospital.type },
            ].map(item => (
              <div key={item.k}>
                <dt className="text-sm uppercase tracking-[0.1em] text-ink/60">{item.k}</dt>
                <dd className="mt-1 text-base font-medium text-ink">{item.v}</dd>
              </div>
))}
          </dl>
        </div>

        <div className="glass overflow-hidden rounded-[16px]">
          <button
            onClick={() => setShowMap(s => !s)}
            className="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left transition-colors hover:bg-white/60"
            aria-expanded={showMap}
          >
            <span className="text-base font-medium text-ink">Location on map</span>
            <span className="text-sm text-ink/60">{showMap ? "Hide" : "Show"}</span>
          </button>
          <div
            className={cn(
              "relative transition-all duration-[520ms] [transition-timing-function:var(--ease-glide)]",
              showMap ? "h-[220px] opacity-100" : "h-0 overflow-hidden opacity-0"
)}
          >
            {showMap && (
              <iframe
                title={`Map of ${hospital.name}`}
                src={facilityMapUrl(hospital)}
                className="h-full w-full border-0 grayscale-[0.35] contrast-[1.05]"
                loading="lazy"
              />
)}
          </div>
          {!showMap && (
            <div className="flex items-center gap-3 p-4">
              <span className="font-mono text-sm text-ink/55">
                {hospital.lat.toFixed(5)}, {hospital.lon.toFixed(5)}
              </span>
              <a
                href={openStreetMapLink(hospital)}
                target="_blank"
                rel="noreferrer noopener"
                className="ml-auto text-sm text-ink/55 underline decoration-ink/25 underline-offset-4 hover:text-ink hover:decoration-ink"
              >
                OpenStreetMap record
              </a>
            </div>
)}
        </div>
      </div>

      <section className="mt-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-[-0.015em] text-ink">
          <Stethoscope className="h-4 w-4 text-ink/60" />
          Specialities mapped for this facility
        </h2>
        {deptQuery.isLoading && (
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-[12px]" />
))}
          </div>
)}

        {deptQuery.isError && (
          <div className="mt-2.5">
            <EmptyState
              tone="alert"
              icon={<Stethoscope className="h-5 w-5" />}
              title="Could not load departments"
              description={errorMessage(deptQuery.error)}
              action={<Button size="lg" onClick={() => void deptQuery.refetch()}>Try again</Button>}
            />
          </div>
)}

        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          {departments.map(dept => (
            <button
              key={dept.id}
              onClick={() => navigate(`/patient/department/${hospital.id}?dept=${dept.id}`)}
              className="glass-hover group flex items-center justify-between gap-3 rounded-[12px] border border-line bg-white/50 px-4 py-3 text-left hover:border-ink/25 hover:bg-white/80"
            >
              <span className="min-w-0">
                <span className="block truncate text-base font-medium text-ink">{dept.name}</span>
                <span className="mt-0.5 block text-sm text-ink/60">
                  {dept.doctors} {dept.doctors === 1 ? "doctor on roster" : "doctors on roster"}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink/60 transition-transform duration-[420ms] [transition-timing-function:var(--ease-spring)] group-hover:translate-x-1 group-hover:text-ink" />
            </button>
))}
        </div>
        {hospital.specialities.length === 0 && (
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink/60">
            No speciality tags are mapped for this facility, so the standard OPD list is shown.
          </p>
)}
      </section>
    </KioskLayout>
);
}
