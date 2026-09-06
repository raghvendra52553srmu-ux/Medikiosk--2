import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/context/AppContext";
import { registerPatient } from "@/services/patientService";
import { ApiError, errorMessage } from "@/services/apiClient";
import { cn } from "@/utils/cn";
import { Save, ArrowRight, Loader2 } from "lucide-react";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const { t, language } = useApp();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("F");
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    if (submitting) return;

    // Client-side validation mirrors the server's Zod schema so the patient gets
    // instant feedback; the server still re-validates and remains authoritative.
    const next = {};
    if (name.trim().length < 3) next.name = t("reg.nameError");
    if (!/^[6-9]\d{9}$/.test(mobile)) next.mobile = t("reg.mobileError");
    const n = Number(age);
    if (!age || Number.isNaN(n) || n < 1 || n > 120) next.age = t("reg.ageError");
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await registerPatient({ name: name.trim(), age: n, sex, mobile, language: language.code });
      navigate("/patient/history");
    } catch (err) {
      // Surface server field errors on the matching inputs.
      if (err instanceof ApiError && err.details?.length) {
        const fields = err.fieldErrors;
        setErrors({ name: fields.name, mobile: fields.mobile, age: fields.age });
      }
      toast(errorMessage(err), { tone: "flag" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KioskLayout
      title={t("reg.title")}
      intro={t("reg.helper")}
      step={{ current: 5, total: 8, label: "Registration" }}
    >
      <div className="space-y-4 rounded-[16px] border border-zinc-200 bg-white/95 p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/95 sm:p-6 text-left">
        <Input
          label={t("reg.name")}
          placeholder={t("reg.namePlaceholder")}
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
          error={errors.name}
          autoComplete="name"
        />

        <Input
          label={t("reg.mobile")}
          placeholder="10-digit mobile number"
          helperText={t("reg.mobileHelper")}
          leading={<span className="font-mono text-base font-bold text-zinc-600 dark:text-zinc-300">+91</span>}
          value={mobile}
          onChange={e => {
            setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
            setErrors(p => ({ ...p, mobile: undefined }));
          }}
          error={errors.mobile}
          inputMode="numeric"
          autoComplete="tel"
        />

        <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
          <Input
            label={t("reg.age")}
            placeholder="Age"
            value={age}
            onChange={e => { setAge(e.target.value.replace(/\D/g, "").slice(0, 3)); setErrors(p => ({ ...p, age: undefined })); }}
            error={errors.age}
            inputMode="numeric"
          />

          <fieldset className="text-left">
            <legend className="mb-1.5 text-base font-bold text-zinc-900 dark:text-zinc-100">{t("reg.sex")}</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("reg.sex")}>
              {(["M", "F", "O"]).map(option => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={sex === option}
                  onClick={() => setSex(option)}
                  className={cn(
                    "h-12 rounded-[12px] border text-base font-bold transition-all duration-150 active:scale-95 cursor-pointer",
                    sex === option
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40 dark:bg-emerald-500 dark:text-zinc-950"
                      : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:border-emerald-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
)}
                >
                  {option === "M" ? t("reg.sexMale") : option === "F" ? t("reg.sexFemale") : t("reg.sexOther")}
                </button>
))}
            </div>
          </fieldset>
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm sm:text-base font-medium text-zinc-600 dark:text-zinc-400">
            Only used to match your token at the OPD desk.
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-6 sm:px-6 z-20">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          aria-busy={submitting}
          className="w-full inline-flex items-center justify-center gap-3 rounded-[14px] bg-emerald-600 px-8 py-4 text-lg font-extrabold text-white shadow-xl shadow-emerald-600/30 transition-all duration-150 hover:bg-emerald-500 active:scale-95 active:bg-emerald-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
        >
          <span>{submitting ? "Saving…" : t("reg.continue")}</span>
          {submitting ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
) : (
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
)}
        </button>
      </div>
    </KioskLayout>
);
}
