import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApp } from "@/context/AppContext";
import {
  fetchFacilities,
  geocodePlace,
  requestDeviceLocation,

} from "@/services/geoService";
import { saveFacilitySession } from "@/services/hospitalService";

import { AlertTriangle, Crosshair, Keyboard, Loader2, MapPin } from "lucide-react";
import { cn } from "@/utils/cn";

function StageList({ stage }) {
  const steps = [
    { label: "Finding your area", done: stage === "fetch", active: stage === "place" },
    { label: "Querying nearby facilities", done: false, active: stage === "fetch" },
  ];
  return (
    <div className="glass-strong mb-3 rounded-[13px] p-4">
      <p className="flex items-center gap-2.5 text-base font-medium text-ink">
        <Loader2 className="h-4 w-4 animate-spin" />
        {stage === "fetch" ? "Reading the facility list…" : "Finding your area…"}
      </p>
      <ol className="mt-2.5 space-y-2">
        {steps.map(s => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500",
                s.done ? "bg-ink" : s.active ? "animate-pulse bg-ink/60" : "bg-ink/15"
)}
            />
            <span className={cn("text-base", s.done || s.active ? "text-ink/75" : "text-ink/60")}>
              {s.label}
            </span>
            {s.done && <Badge tone="quiet">done</Badge>}
          </li>
))}
      </ol>
      <p className="mt-2.5 text-sm leading-relaxed text-ink/60">
        Map servers are public and shared — the first search can take 10–25 seconds. Three servers are
        tried at once; the first answer is used.
      </p>
    </div>
);
}

export default function LocationPage() {
  const navigate = useNavigate();
  const { t } = useApp();
  const [phase, setPhase] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(null);
  const [query, setQuery] = useState("");
  const [manualError, setManualError] = useState("");
  const [failure, setFailure] = useState(null);
  const [coordsLabel, setCoordsLabel] = useState(null);
  const abortRef = useRef(null);
  const lastGeo = useRef(null);
  const lastDeviceCoords = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const fail = (f) => {
    setFailure(f);
    setPhase("error");
  };

  /** Step 2: ask the map mirrors for facilities around known coordinates. */
  const runFacilityFetch = async (coords, source, ctrl) => {
    setStage("fetch");
    if (source === "device") setPhase("fetching");
    try {
      const result = await fetchFacilities(coords, ctrl.signal);
      saveFacilitySession({ ...result, source });
      navigate("/patient/doctors");
    } catch (err) {
      if ((err).name === "AbortError") return;
      fail({
        stage: "fetch",
        origin: source,
        title: "The map service did not answer",
        body: (err).message || "None of the public map servers responded.",
      });
    }
  };

  const runDeviceFlow = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFailure(null);
    setPhase("locating");

    const outcome = await requestDeviceLocation(ctrl.signal);

    if (outcome.state === "unsupported") {
      setPhase("manual");
      setFailure({
        stage: "fetch",
        origin: "device",
        title: "This browser cannot share a location",
        body: "The kiosk browser has no location support. Type your area instead — the same hospitals will be found.",
      });
      return;
    }
    if (outcome.state === "insecure") {
      setPhase("manual");
      setFailure({
        stage: "fetch",
        origin: "device",
        title: "Location needs a secure connection",
        body: outcome.message,
      });
      return;
    }
    if (outcome.state === "denied") {
      setPhase("manual");
      setFailure({
        stage: "fetch",
        origin: "device",
        title: t("loc.deniedTitle"),
        body: t("loc.deniedBody"),
      });
      return;
    }
    if (outcome.state === "unavailable") {
      setPhase("manual");
      setFailure({
        stage: "fetch",
        origin: "device",
        title: "No position fix",
        body: outcome.message,
      });
      return;
    }

    lastDeviceCoords.current = outcome.coords;
    setCoordsLabel(`${outcome.coords.lat.toFixed(4)}, ${outcome.coords.lon.toFixed(4)} · ±${outcome.accuracy} m`);
    await runFacilityFetch(outcome.coords, "device", ctrl);
  };

  /** Retry only the step that actually failed — a fetch failure never re-searches the area. */
  const retry = async () => {
    if (!failure) return;
    if (failure.origin === "search") {
      void runSearchFlow(); // cached geo is reused automatically when the query is unchanged
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFailure(null);
    if (lastDeviceCoords.current) {
      await runFacilityFetch(lastDeviceCoords.current, "device", ctrl);
    } else {
      await runDeviceFlow();
    }
  };

  const runSearchFlow = async () => {
    const value = query.trim();
    if (value.length < 3 && !/^\d{6}$/.test(value)) {
      setManualError(t("loc.manualError"));
      return;
    }
    setManualError("");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFailure(null);
    setBusy(true);
    let failedStage = "place";
    try {
      const cached = lastGeo.current;
      if (cached && cached.query === value) {
        // Area was already resolved — jump straight to the facility step.
        failedStage = "fetch";
        setStage("fetch");
      } else {
        failedStage = "place";
        setStage("place");
        const found = await geocodePlace(value);
        lastGeo.current = { query: value, coords: found.coords };
        setCoordsLabel(found.place.detail);
      }
      failedStage = "fetch";
      const coords = lastGeo.current?.coords;
      if (!coords) throw new Error("No position was resolved for that search.");
      const result = await fetchFacilities(coords, ctrl.signal);
      saveFacilitySession({ ...result, source: "search" });
      navigate("/patient/doctors");
    } catch (err) {
      if ((err).name === "AbortError") return;
      const message = (err).message || "";
      fail(
        failedStage === "place"
          ? {
              stage: "place",
              origin: "search",
              title: "We couldn't look up that area",
              body: message,
            }
          : {
              stage: "fetch",
              origin: "search",
              title: "The map service did not answer",
              body: message,
            }
);
    } finally {
      setBusy(false);
      setStage(null);
    }
  };

  if (phase === "manual" || phase === "error") {
    return (
      <KioskLayout
        title={t("loc.title")}
        intro={t("loc.helper")}
        step={{ current: 2, total: 8, label: "Location" }}
      >
        {/* Was gated on phase === "error" only — but requestDeviceLocation failures
            (denied / no GPS fix / insecure origin / unsupported) all land on
            phase "manual", so that condition hid the reason entirely and the
            patient was just dropped on the typing screen with no explanation. */}
        {failure && (
          <div className="mb-4 flex items-start gap-3 rounded-[13px] border border-ink/30 bg-white/70 p-4">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink" />
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium text-ink">{failure.title}</p>
              <p className="mt-1 text-base leading-relaxed text-ink/60">{failure.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="md" onClick={() => void retry()}>
                  Try again
                </Button>
                {failure.origin === "search" && (
                  <Button size="md" variant="tertiary" onClick={() => void runDeviceFlow()}>
                    Use my current location instead
                  </Button>
)}
              </div>
            </div>
          </div>
)}

        {busy && stage && <StageList stage={stage} />}

        <div className="glass-strong space-y-4 rounded-[16px] p-5 sm:p-6">
          <Input
            label={t("loc.manualTitle")}
            placeholder={t("loc.placeholder")}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setManualError("");
            }}
            error={manualError}
            leading={<MapPin className="h-4 w-4" />}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") void runSearchFlow();
            }}
          />
          <Button
            size="kiosk"
            fullWidth
            loading={busy}
            onClick={() => void runSearchFlow()}
            icon={<Keyboard className="h-[18px] w-[18px]" />}
          >
            {busy ? t("loc.fetching") : t("loc.search")}
          </Button>
          {!busy && (
            <Button variant="tertiary" size="lg" fullWidth onClick={() => { setFailure(null); void runDeviceFlow(); }}>
              {t("loc.instead")}
            </Button>
)}
        </div>

        <p className="mt-4 text-sm sm:text-base leading-relaxed text-ink/60">
          Place names are resolved through OpenStreetMap, then health facilities are queried around
          that point. If the campus network blocks the map servers, a phone hotspot will work.
        </p>
      </KioskLayout>
);
  }

  return (
    <KioskLayout
      title={t("loc.title")}
      intro={phase === "idle" ? t("loc.helper") : undefined}
      step={{ current: 2, total: 8, label: "Location" }}
      aside={
        coordsLabel ? (
          <Badge tone="outline" mark="dot" className="hidden md:inline-flex">
            <MapPin className="h-3 w-3" />
            {coordsLabel.split(" · ")[0]}
          </Badge>
) : undefined
      }
    >
      {phase === "idle" && (
        <div className="grid gap-3.5 sm:grid-cols-[1.15fr_0.85fr]">
          <button
            onClick={() => void runDeviceFlow()}
            className="group relative overflow-hidden rounded-[18px] border-2 border-emerald-500/40 bg-white p-6 text-left shadow-xs transition-all duration-150 hover:border-emerald-500 hover:shadow-md active:scale-95 active:ring-4 active:ring-emerald-500/30 dark:border-emerald-500/30 dark:bg-zinc-900 cursor-pointer"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-emerald-600 text-white shadow-md shadow-emerald-600/30 dark:bg-emerald-500 dark:text-zinc-950">
              <Crosshair className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
            </span>
            <h2 className="mt-4 font-bold text-2xl text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {t("loc.useLocation")}
            </h2>
            <p className="mt-2 text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your browser will ask for permission once. The position is used only to measure distance.
            </p>
          </button>

          <button
            onClick={() => setPhase("manual")}
            className="group flex flex-col items-start rounded-[18px] border-2 border-zinc-200 bg-white p-6 text-left shadow-xs transition-all duration-150 hover:border-emerald-400 hover:shadow-md active:scale-95 active:ring-4 active:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 group-hover:border-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Keyboard className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-bold text-xl text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {t("loc.manual")}
            </h2>
            <p className="mt-2 text-base font-medium leading-relaxed text-zinc-600 dark:text-zinc-400">
              Type an area or PIN code. Works when GPS is off or permission is blocked.
            </p>
          </button>
        </div>
)}

      {(phase === "locating" || phase === "fetching") && (
        <div className="glass-strong overflow-hidden rounded-[16px]">
          <div className="flex items-start gap-4 p-5">
            <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full" />
              <Loader2 className="h-6 w-6 animate-spin text-ink" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                {phase === "locating" ? t("loc.locating") : t("loc.fetching")}
              </p>
              <p className="mt-1 text-base leading-relaxed text-ink/55">
                {phase === "locating"
                  ? "Waiting for the device to report a position."
                  : "Three map servers are being asked at once; the first answer is used. Public servers can take 10–25 seconds."}
              </p>
            </div>
          </div>

          <div className="border-t border-line px-5 py-3">
            <ol className="space-y-2">
              {[
                { label: "Device permission", done: true, active: false },
                { label: "Reading coordinates", done: phase !== "locating", active: phase === "locating" },
                { label: "Querying nearby facilities", done: false, active: phase === "fetching" },
              ].map(step => (
                <li key={step.label} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500",
                      step.done ? "bg-ink" : step.active ? "animate-pulse bg-ink/60" : "bg-ink/15"
)}
                  />
                  <span className={cn("text-base", step.done || step.active ? "text-ink/75" : "text-ink/60")}>
                    {step.label}
                  </span>
                  {step.done && <Badge tone="quiet">done</Badge>}
                </li>
))}
            </ol>
          </div>
        </div>
)}
    </KioskLayout>
);
}
