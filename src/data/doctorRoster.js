/**
 * Canonical OPD doctor roster.
 * Exactly matches apps/api/src/config/roster.js and the original MediKiosk roster.
 */

export const SPECIALITY_ALIASES = {
  "General": "General Medicine",
  "General medicine": "General Medicine",
  "Medicine": "General Medicine",
  "Internal": "General Medicine",
  "Paediatrics": "Paediatrics",
  "Pediatrics": "Paediatrics",
  "Child": "Paediatrics",
  "Gynae": "Obstetrics & Gynaecology",
  "Gynaecology": "Obstetrics & Gynaecology",
  "Obstetrics and Gynaecology": "Obstetrics & Gynaecology",
  "Orthopaedics": "Orthopaedics",
  "Orthopedics": "Orthopaedics",
  "Surgery": "General Surgery",
  "ENT": "ENT",
  "Ophthalmology": "Ophthalmology",
  "Dermatology": "Dermatology",
  "Cardiology": "Cardiology",
  "Neurology": "Neurology",
  "Dental": "Dental"
};

export const STANDARD_DEPARTMENTS = [
  "Cardiology",
  "General Medicine",
  "Orthopaedics",
  "Paediatrics",
  "Ophthalmology",
  "Dermatology",
  "Neurology",
  "Obstetrics & Gynaecology",
  "ENT",
  "Dental",
  "General Surgery"
];

export const DOCTOR_ROSTER = {
  "Cardiology": [
    {
      name: "Dr. Vikram Deshmukh",
      qualification: "MBBS, MD, DM (Cardiology) - Senior Interventional Cardiologist",
      specialty: "Heart & Blood Pressure Specialist (हृदय रोग विशेषज्ञ)",
      room: "204",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    },
    {
      name: "Dr. Rajesh Sharma",
      qualification: "MBBS, MD (Cardiology), FACC",
      specialty: "Consultant Cardiologist & Cardiac Care (कार्डियोलॉजिस्ट)",
      room: "205",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ],
  "General Medicine": [
    {
      name: "Dr. Sunita Patil",
      qualification: "MBBS, MD (Internal Medicine) - Senior Physician",
      specialty: "Fever, Infection & General Health (सामान्य चिकित्सक)",
      room: "102",
      opdStartMin: 480,
      opdEndMin: 840,
      slotMinutes: 5
    },
    {
      name: "Dr. Amit Kulkarni",
      qualification: "MBBS, MD (Medicine), DNB",
      specialty: "Consultant Physician & Chronic Care (फिजिशियन)",
      room: "103",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    }
  ],
  "Orthopaedics": [
    {
      name: "Dr. Sanjay Bhosale",
      qualification: "MBBS, MS (Orthopaedics), M.Ch (Joint Replacement)",
      specialty: "Bone, Joint & Trauma Surgeon (हड्डी व जोड़ विशेषज्ञ)",
      room: "301",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    },
    {
      name: "Dr. Nilesh Pawar",
      qualification: "MBBS, D.Ortho, MS (Orthopaedics)",
      specialty: "Spine & Fracture Specialist (हड्डी रोग चिकित्सक)",
      room: "302",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    }
  ],
  "Paediatrics": [
    {
      name: "Dr. Priya Joshi",
      qualification: "MBBS, DCH, MD (Paediatrics) - Child Care Specialist",
      specialty: "Pediatrician & Child Specialist (शिशु व बाल रोग विशेषज्ञ)",
      room: "108",
      opdStartMin: 510,
      opdEndMin: 840,
      slotMinutes: 5
    },
    {
      name: "Dr. Anjali More",
      qualification: "MBBS, MD (Paediatrics), Fellowship Neonatology",
      specialty: "Consultant Pediatrician (बाल रोग विशेषज्ञ)",
      room: "109",
      opdStartMin: 540,
      opdEndMin: 810,
      slotMinutes: 5
    }
  ],
  "Ophthalmology": [
    {
      name: "Dr. Deepa Gaikwad",
      qualification: "MBBS, MS (Ophthalmology), FICO - Eye Surgeon",
      specialty: "Ophthalmologist & Eye Care Specialist (नेत्र रोग विशेषज्ञ)",
      room: "402",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    },
    {
      name: "Dr. Anil Jadhav",
      qualification: "MBBS, DO (Ophthalmology)",
      specialty: "Consultant Eye Specialist (आंखों के डॉक्टर)",
      room: "403",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ],
  "Dermatology": [
    {
      name: "Dr. Kavita Salunkhe",
      qualification: "MBBS, MD (Dermatology, Venereology & Leprosy), DNB",
      specialty: "Dermatologist & Skin/Allergy Specialist (त्वचा व एलर्जी विशेषज्ञ)",
      room: "212",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    },
    {
      name: "Dr. Meera Chavan",
      qualification: "MBBS, DDVL (Dermatology)",
      specialty: "Consultant Skin & Hair Specialist (त्वचा रोग चिकित्सक)",
      room: "213",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ],
  "Neurology": [
    {
      name: "Dr. Arvind Iyer",
      qualification: "MBBS, MD, DM (Neurology) - Senior Neurologist",
      specialty: "Brain, Nerve & Headache Specialist (न्यूरोलॉजिस्ट)",
      room: "308",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    },
    {
      name: "Dr. Rohit Verma",
      qualification: "MBBS, MD (Medicine), Fellowship Neuro",
      specialty: "Consultant Neurophysician (मस्तिष्क व नस रोग)",
      room: "309",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    }
  ],
  "Obstetrics & Gynaecology": [
    {
      name: "Dr. Shobha Kulkarni",
      qualification: "MBBS, MS, DGO (Obstetrics & Gynaecology)",
      specialty: "Senior Gynaecologist & Women's Health (महिला रोग विशेषज्ञ)",
      room: "114",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    },
    {
      name: "Dr. Neha Gupta",
      qualification: "MBBS, DGO (Gynaecology)",
      specialty: "Consultant Obstetrician & Gynaecologist (स्त्री रोग विशेषज्ञ)",
      room: "115",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ],
  "ENT": [
    {
      name: "Dr. Siddharth Rao",
      qualification: "MBBS, MS (ENT / Otorhinolaryngology)",
      specialty: "Ear, Nose & Throat Specialist (कान, नाक, गला विशेषज्ञ)",
      room: "406",
      opdStartMin: 510,
      opdEndMin: 810,
      slotMinutes: 5
    }
  ],
  "Dental": [
    {
      name: "Dr. Vivek Nair",
      qualification: "BDS, MDS (Oral & Maxillofacial Surgery)",
      specialty: "Dental Surgeon & Oral Health (दंत रोग विशेषज्ञ)",
      room: "Dental-01",
      opdStartMin: 510,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ],
  "General Surgery": [
    {
      name: "Dr. Mohan Ranade",
      qualification: "MBBS, MS (General Surgery), FMAS",
      specialty: "Senior General Surgeon (शल्य चिकित्सक)",
      room: "305",
      opdStartMin: 540,
      opdEndMin: 840,
      slotMinutes: 5
    }
  ]
};

export function initialsOf(name) {
  const parts = name.replace(/^dr\.?\s+/i, "").replace(/\./g, " ").split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function minToLabel(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
}

export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
