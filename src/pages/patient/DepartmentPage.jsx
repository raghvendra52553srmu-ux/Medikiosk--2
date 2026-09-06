import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getFacility, dbIdFor } from "@/services/hospitalService";
import { getDepartments, getDoctors } from "@/services/doctorService";
import { errorMessage } from "@/services/apiClient";
import { qk } from "@/lib/queryClient";
import { ArrowRight, FlaskConical, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/utils/cn";

export default function DepartmentPage() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const hospital = useMemo(() => getFacility(hospitalId ?? undefined), [hospitalId]);

  // Departments and doctors are real rows, provisioned for this facility the
  // first time a patient selects it.
  const deptQuery = useQuery({
    queryKey: qk.departments(dbIdFor(hospital?.id) ?? hospital?.id ?? "none"),
    queryFn: () => getDepartments(hospital),
    enabled: Boolean(hospital),
  });

  const departments = deptQuery.data ?? [];
  const activeDeptId = params.get("dept") ?? departments[0]?.id ?? "";
  const activeDept = departments.find(d => d.id === activeDeptId) ?? null;

  const doctorQuery = useQuery({
    queryKey: qk.doctors(dbIdFor(hospital?.id) ?? "none", activeDept?.name),
    queryFn: () => getDoctors(hospital, { department: activeDept.name }),
    enabled: Boolean(hospital && activeDept),
  });

  const doctors = doctorQuery.data ?? [];

  if (!hospital) {
    return (
      <KioskLayout title="Facility unavailable" step={{ current: 5, total: 9, label: "Doctor" }}>
        <EmptyState
          tone="alert"
          icon={<Info className="h-5 w-5" />}
          title="Pick a hospital first"
          description="The facility you were looking at is not in the current search result."
          action={
            <button onClick={() => navigate("/patient/hospitals")} className="text-base font-bold text-emerald-600 underline dark:text-emerald-400">
              Back to nearby hospitals
            </button>
          }
        />
      </KioskLayout>
);
  }

  return (
    <KioskLayout
      title="Department & Doctor"
      intro="Select department and choose an available doctor for your OPD consultation."
      step={{ current: 5, total: 9, label: "Doctor" }}
    >
      {deptQuery.isLoading && (
        <div className="mb-4.5 flex gap-2 overflow-hidden" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[42px] w-28 shrink-0 rounded-full" />
))}
        </div>
)}

      {deptQuery.isError && (
        <EmptyState
          tone="alert"
          icon={<TriangleAlert className="h-5 w-5" />}
          title="Could not load departments"
          description={errorMessage(deptQuery.error)}
          action={<Button size="lg" onClick={() => void deptQuery.refetch()}>Try again</Button>}
        />
)}

      <div className="no-scrollbar -mx-4 mb-4.5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => setParams({ dept: dept.id })}
            aria-pressed={activeDeptId === dept.id}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-2 text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-xs",
              activeDeptId === dept.id
                ? "border-emerald-500 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30 dark:bg-emerald-500 dark:text-zinc-950"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
)}
          >
            {dept.name}
          </button>
))}
      </div>

      <div className="space-y-3">
        {doctorQuery.isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading doctors…</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[128px] w-full rounded-[16px]" />
))}
          </div>
) : doctorQuery.isError ? (
          <EmptyState
            tone="alert"
            icon={<TriangleAlert className="h-5 w-5" />}
            title="Could not load doctors"
            description={errorMessage(doctorQuery.error)}
            action={<Button size="lg" onClick={() => void doctorQuery.refetch()}>Try again</Button>}
          />
) : doctors.length === 0 ? (
          <EmptyState
            icon={<FlaskConical className="h-5 w-5" />}
            title="No doctor listed for this department today"
            description="Try another department, or take a general OPD token at the counter."
          />
) : (
          doctors.map((doc, i) => (
            <button
              key={doc.id}
              disabled={!doc.available}
              onClick={() => navigate(`/patient/doctor/${doc.id}?h=${hospital.id}&dept=${activeDeptId}`)}
              style={{ ["--i" ]: i }}
              className={cn(
                "reveal group w-full rounded-[16px] border-2 p-4.5 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-xs",
                doc.available
                  ? "border-zinc-200 bg-white hover:border-emerald-500 hover:shadow-md active:border-emerald-600 active:ring-2 active:ring-emerald-500/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-400"
                  : "cursor-not-allowed border-zinc-200 bg-zinc-100 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
)}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-50 font-bold text-emerald-800 text-lg dark:bg-emerald-950/60 dark:text-emerald-300">
                  {doc.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-lg text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {doc.name}
                      </p>
                      <p className="text-base font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {doc.qualification}
                      </p>
                    </div>
                    <Badge tone={doc.available ? "solid" : "quiet"} mark={doc.available ? "dot" : "ring"}>
                      {doc.available ? "Available" : "Away"}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                    <span className="text-sm sm:text-base font-semibold text-zinc-500 dark:text-zinc-400">
                      {doc.room ? `Room ${doc.room} · ` : ""}{doc.opdTiming}
                    </span>
                    <span className="inline-flex items-center gap-1 text-base font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      Select Doctor <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
))
)}
      </div>
    </KioskLayout>
);
}
