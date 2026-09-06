import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KioskLayout } from "@/components/layout/KioskLayout";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { useApp } from "@/context/AppContext";
import { saveClinic } from "@/services/patientService";
import { speechSupported, startListening, } from "@/utils/speech";
import { Activity, ArrowRight, CheckCircle2, Heart, Mic, Sparkles, Square, Stethoscope, Thermometer, Baby, Eye, Bone, Pill, Brain } from "lucide-react";
import { cn } from "@/utils/cn";













const PRESETS = [
  {
    id: "chest_pain",
    label: "Chest Pain / Heart / BP",
    nativeLabel: "हृदय / छाती में दर्द",
    icon: Heart,
    keywords: ["chest", "heart", "pain", "bp", "breath", "pressure", "cardio", "छाती", "दिल", "दर्द", "सांस", "हार्ट", "বুক", "হৃদরোগ", "छातीत", "இதயம்", "గుండె"],
    department: "Cardiology",
    specialist: "Cardiologist (हृदय रोग विशेषज्ञ)",
    urgency: "Priority Consultation",
    prompt: "I am having severe chest pain, high blood pressure and difficulty breathing.",
  },
  {
    id: "fever_cold",
    label: "Fever, Cough & Cold",
    nativeLabel: "बुखार, खांसी व जुकाम",
    icon: Thermometer,
    keywords: ["fever", "cough", "cold", "flu", "shivering", "chills", "weakness", "बुखार", "खांसी", "जुकाम", "ठंड", "জ্বর", "काक", "ताप", "காய்ச்சல்", "జ్వరం"],
    department: "General Medicine",
    specialist: "General Physician (सामान्य चिकित्सक)",
    urgency: "Standard OPD",
    prompt: "Having high fever, cough, body ache and weakness for the past 3 days.",
  },
  {
    id: "bone_joint",
    label: "Bone, Joint & Fracture",
    nativeLabel: "हड्डी व जोड़ों का दर्द",
    icon: Bone,
    keywords: ["bone", "joint", "knee", "back", "fracture", "pain", "swelling", "ortho", "हड्डी", "जोड़", "कमर", "फ्रैक्चर", "হাড়", "सांधे", "மூட்டு", "ఎముక"],
    department: "Orthopaedics",
    specialist: "Orthopedic Surgeon (हड्डी रोग विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Severe joint pain and difficulty walking due to knee and back injury.",
  },
  {
    id: "child_health",
    label: "Child & Infant Health",
    nativeLabel: "बच्चों की बीमारी",
    icon: Baby,
    keywords: ["child", "baby", "infant", "kid", "pediatric", "paediatric", "vomit", "बच्चा", "शिशु", "बाल", "শিশু", "मूल", "குழந்தை", "పిల్లలు"],
    department: "Paediatrics",
    specialist: "Pediatrician (शिशु व बाल रोग विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "My child is experiencing continuous fever, vomiting and loss of appetite.",
  },
  {
    id: "eye_vision",
    label: "Eye Redness & Vision",
    nativeLabel: "आंखों की समस्या",
    icon: Eye,
    keywords: ["eye", "vision", "blur", "redness", "itching", "sight", "ophthalmology", "आंख", "धुंधला", "दृष्टि", "চোখ", "डोळे", "கண்", "కన్ను"],
    department: "Ophthalmology",
    specialist: "Ophthalmologist (नेत्र रोग विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Severe redness, irritation and blurred vision in the eyes.",
  },
  {
    id: "skin_allergy",
    label: "Skin Rash & Allergy",
    nativeLabel: "त्वचा रोग व एलर्जी",
    icon: Activity,
    keywords: ["skin", "rash", "allergy", "itching", "spots", "derma", "त्वचा", "खुजली", "एलर्जी", "चकत्ते", "চামড়া", "தோல்", "చర్మం"],
    department: "Dermatology",
    specialist: "Dermatologist (त्वचा व एलर्जी विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Itching, red rash and skin allergy irritation all over the body.",
  },
  {
    id: "stomach_pain",
    label: "Stomach Pain & Acidity",
    nativeLabel: "पेट दर्द व गैस",
    icon: Pill,
    keywords: ["stomach", "abdomen", "gas", "acidity", "vomiting", "loose", "gastro", "पेट", "गैस", "दस्त", "उल्टी", "পেট", "पोट", "வயிறு", "కడుపు"],
    department: "General Medicine",
    specialist: "Gastro / General Physician (पेट व सामान्य चिकित्सक)",
    urgency: "Standard OPD",
    prompt: "Severe abdominal stomach pain, nausea and acidity after meals.",
  },
  {
    id: "headache_nerves",
    label: "Headache & Dizziness",
    nativeLabel: "सिरदर्द व चक्कर",
    icon: Brain,
    keywords: ["headache", "migraine", "dizziness", "nerve", "faint", "neuro", "सिरदर्द", "चक्कर", "माइग्रेन", "माथাব্যথা", "डोकेदुखी", "தலைவலி", "తలనొప్పి"],
    department: "Neurology",
    specialist: "Neurologist / Neurophysician (न्यूरोलॉजिस्ट)",
    urgency: "Standard OPD",
    prompt: "Severe throbbing headache, nerve discomfort and frequent dizziness.",
  },
  {
    id: "ent_problem",
    label: "Ear, Nose & Throat",
    nativeLabel: "कान, नाक व गला",
    icon: Activity,
    keywords: ["ear", "nose", "throat", "ent", "hearing", "sinus", "tonsil", "hoarse", "कान", "नाक", "गला", "টंसिल", "घसा", "தொண்டை", "గొంతు"],
    department: "ENT",
    specialist: "ENT Specialist (कान, नाक, गला विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Severe throat pain, ear blockage and difficulty swallowing.",
  },
  {
    id: "women_health",
    label: "Women's Health & Gynae",
    nativeLabel: "महिला स्वास्थ्य व प्रसूति",
    icon: Stethoscope,
    keywords: ["women", "pregnant", "pregnancy", "period", "gynae", "gynaecology", "obstetrics", "pelvic", "महिला", "गर्भावस्था", "स्त्री", "प्रसूति", "স্ত্রী", "स्त्रीरोग", "பெண்கள்", "మహిళలు"],
    department: "Obstetrics & Gynaecology",
    specialist: "Gynaecologist & Obstetrician (स्त्री व प्रसूति रोग विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Consultation needed for women's health, pregnancy care and pelvic symptoms.",
  },
  {
    id: "dental_care",
    label: "Dental & Tooth Pain",
    nativeLabel: "दांत व मसूड़ों का दर्द",
    icon: Sparkles,
    keywords: ["dental", "tooth", "teeth", "gum", "dentist", "decay", "cavity", "दांत", "मसूड़े", "दाढ़", "दাঁত", "दात", "பல்", "పంటి"],
    department: "Dental",
    specialist: "Dental Surgeon (दंत रोग विशेषज्ञ)",
    urgency: "Standard OPD",
    prompt: "Severe toothache, bleeding gums and dental pain while chewing.",
  },
];

export default function ProblemTriagePage() {
  const navigate = useNavigate();
  const { language } = useApp();
  const [problemText, setProblemText] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState("chest_pain");
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const [speechError, setSpeechError] = useState("");
  const sessionRef = useRef(null);

  // Initialize with the first preset so doctors are shown right away
  useEffect(() => {
    if (!problemText) {
      setProblemText(PRESETS[0].prompt);
    }
  }, []);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      sessionRef.current?.cancel();
      sessionRef.current = null;
    };
  }, []);

  // Match department according to problem text or selected preset
  const matchResult = useMemo(() => {
    // If a preset is actively clicked, use it directly
    if (selectedPresetId) {
      const p = PRESETS.find(pr => pr.id === selectedPresetId);
      if (p) {
        return {
          matchedPreset: p,
          department: p.department,
          specialist: p.specialist,
          urgency: p.urgency,
          reason: `Specialist matching for ${p.label} (${p.department} Department).`,
        };
      }
    }

    const text = problemText.toLowerCase();
    if (!text.trim()) {
      return {
        matchedPreset: PRESETS[0],
        department: "Cardiology",
        specialist: "Cardiologist (हृदय रोग विशेषज्ञ)",
        urgency: "Priority Consultation",
        reason: "Cardiac & General health evaluation.",
      };
    }

    for (const preset of PRESETS) {
      const found = preset.keywords.some(kw => text.includes(kw.toLowerCase()));
      if (found) {
        return {
          matchedPreset: preset,
          department: preset.department,
          specialist: preset.specialist,
          urgency: preset.urgency,
          reason: `Symptoms match ${preset.department} specialty for targeted treatment.`,
        };
      }
    }

    return {
      matchedPreset: null,
      department: "General Medicine",
      specialist: "General Physician (सामान्य चिकित्सक)",
      urgency: "Standard OPD",
      reason: "Initial clinical evaluation with General OPD Physician.",
    };
  }, [problemText, selectedPresetId]);

  const handleToggleVoice = async () => {
    if (isListening) {
      sessionRef.current?.stop();
      setIsListening(false);
      setSpeechStatus("Stopped recording.");
      return;
    }

    if (!speechSupported()) {
      setSpeechError("Your browser speech API is unavailable. Please type or pick a disease from below.");
      return;
    }

    setSpeechError("");
    setSpeechStatus("🎙️ Listening... Please speak your symptoms now.");
    setIsListening(true);
    setSelectedPresetId(null);

    try {
      const { session, done } = startListening({
        lang: language.code,
        onStart: () => {
          setIsListening(true);
          setSpeechStatus("🎙️ Listening in your language... Speak clearly.");
        },
        onInterim: liveText => {
          setProblemText(liveText);
          setSelectedPresetId(null);
        },
      });

      sessionRef.current = session;
      const result = await done;
      sessionRef.current = null;
      setIsListening(false);

      if (result.ok && result.transcript.trim()) {
        const heard = result.transcript.trim();
        setProblemText(heard);
        setSpeechStatus(`✅ Voice recorded: "${heard}"`);
      } else if (!result.ok) {
        if (result.reason !== "aborted") {
          setSpeechError(result.message || "Could not catch speech. Please try speaking again or select a preset.");
          setSpeechStatus("");
        }
      }
    } catch (err) {
      setIsListening(false);
      setSpeechError("Microphone connection failed. Please type your symptoms or choose from below.");
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setProblemText(preset.prompt);
    setSpeechStatus(`Selected: ${preset.label}`);
    setSpeechError("");
  };

  return (
    <KioskLayout
      title="Tell Your Health Problem"
      intro="Speak or select your symptoms — we will match you with the right specialist at a hospital near you."
      step={{ current: 1, total: 8, label: "Problem" }}
    >
      {/* Step 1 Indicator Banner */}
      <div className="mb-4 flex items-center justify-between rounded-[14px] border border-emerald-500/40 bg-emerald-50/70 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-950/40 text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold dark:bg-emerald-500 dark:text-zinc-950">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <p className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              Step 1: Clinical Symptom Intake
            </p>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Describe your symptoms once to find the right department &amp; doctor
            </p>
          </div>
        </div>
        <Badge tone="solid" mark="dot">Step 1 of 8</Badge>
      </div>

      {/* Main Problem Input Box with Big Voice Mic */}
      <div className="rounded-[18px] border-2 border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 text-left">
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Describe Your Problem / Symptoms (लक्षण या समस्या बताएं)
          </label>
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            Voice & Text Enabled
          </span>
        </div>

        <Textarea
          placeholder="E.g., High fever with cough for 3 days, acute chest pain, knee joint fracture, child vomiting, red eye itching..."
          value={problemText}
          onChange={e => {
            setProblemText(e.target.value);
            setSelectedPresetId(null);
          }}
          className="min-h-[90px] text-lg font-medium"
        />

        {/* Live Audio Status / Visualizer */}
        {isListening && (
          <div className="mt-3 flex items-center gap-3 rounded-[12px] border border-red-500/40 bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-300 animate-pulse">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-base font-bold">Listening to your voice... Speak now in your language.</span>
          </div>
)}

        {speechStatus && !isListening && (
          <div className="mt-2 text-base font-semibold text-emerald-700 dark:text-emerald-400">
            {speechStatus}
          </div>
)}

        {/* Big Voice Button */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <button
            type="button"
            onClick={handleToggleVoice}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-[12px] px-6 py-3 text-base md:text-lg font-extrabold shadow-md transition-all duration-150 active:scale-95 cursor-pointer",
              isListening
                ? "bg-red-600 text-white animate-pulse shadow-red-600/30"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 dark:bg-emerald-500 dark:text-zinc-950"
)}
          >
            {isListening ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Listening (रोकें)</span>
              </>
) : (
              <>
                <Mic className="h-5 w-5" />
                <span>Speak Into Mic (माइक में बोलें)</span>
              </>
)}
          </button>

          <p className="text-sm sm:text-base font-medium text-zinc-500 dark:text-zinc-400">
            Supports Hindi, English, Bengali, Marathi, Tamil, Telugu
          </p>
        </div>

        {speechError && (
          <p className="mt-2 text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">
            {speechError}
          </p>
)}
      </div>

      {/* Quick Common Disease / Problem Chips */}
      <div className="mt-4 text-left">
        <p className="text-base font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          Select Health Issue / Disease (समस्या या बीमारी चुनें)
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESETS.map(preset => {
            const isSelected = selectedPresetId === preset.id;
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-[14px] border-2 p-3 text-left transition-all duration-150 active:scale-95 cursor-pointer shadow-xs",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/40 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/70"
                    : "border-zinc-200 bg-white hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
)}
              >
                <span className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg font-bold",
                  isSelected
                    ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
)}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className={cn(
                  "text-base font-extrabold leading-tight",
                  isSelected ? "text-emerald-900 dark:text-emerald-200" : "text-zinc-900 dark:text-zinc-100"
)}>
                  {preset.label}
                </span>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {preset.nativeLabel}
                </span>
              </button>
);
          })}
        </div>
      </div>

      {/* Suggested Department & Specialist Box */}
      <div className="mt-5 rounded-[18px] border-2 border-emerald-500/60 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-5 text-left shadow-md dark:border-emerald-500/40 dark:from-emerald-950/40">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-600 text-white font-bold dark:bg-emerald-500 dark:text-zinc-950">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Recommended Department
              </p>
              <h3 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {matchResult.department} Department
              </h3>
            </div>
          </div>
          <Badge tone="solid" mark="dot">{matchResult.urgency}</Badge>
        </div>

        <div className="mt-3 flex items-center gap-2 text-base font-extrabold text-zinc-900 dark:text-zinc-100">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Recommended Specialist: {matchResult.specialist}</span>
        </div>
        <p className="mt-1 text-base font-medium text-zinc-600 dark:text-zinc-300">
          {matchResult.reason}
        </p>
      </div>

      {/* Sticky Bottom Action to Step 2: Location */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-6 sm:px-6 z-20">
        <button
          type="button"
          onClick={() => {
            saveClinic({
              problemText: problemText.trim() || matchResult.matchedPreset?.prompt || "General OPD Consultation",
              department: matchResult.department,
              problemPresetId: selectedPresetId || undefined,
            });
            navigate("/patient/location");
          }}
          className="w-full inline-flex items-center justify-center gap-3 rounded-[14px] bg-emerald-600 px-8 py-4 text-lg font-extrabold text-white shadow-xl shadow-emerald-600/30 transition-all duration-150 hover:bg-emerald-500 active:scale-95 active:bg-emerald-700 cursor-pointer dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
        >
          <span>Continue to Select Location</span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </button>
      </div>
    </KioskLayout>
);
}
