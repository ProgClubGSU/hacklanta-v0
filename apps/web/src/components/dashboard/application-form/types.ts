// ── Types & Constants for the multi-step application wizard ──

export interface ApplicationData {
  id: string;
  status: string;
  university: string;
  major: string;
  year_of_study: string;
  graduation_date: string | null;
  phone_number: string | null;
  email: string | null;
  resume_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  why_attend: string | null;
  experience_level: string | null;
  dietary_restrictions: string | null;
  tshirt_size: string | null;
  age_confirmed: boolean;
  code_of_conduct_accepted: boolean;
  liability_waiver_accepted: boolean;
  how_did_you_hear: string | null;
  resume_sharing_opt_in: boolean;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  created_at: string;
}

export interface FormState {
  university: string;
  major: string;
  year_of_study: string;
  graduation_date: string;
  phone_number: string;
  email: string;
  resume_url: string;
  github_url: string;
  linkedin_url: string;
  why_attend: string;
  experience_level: string;
  dietary_restrictions: string;
  tshirt_size: string;
  age_confirmed: boolean;
  code_of_conduct_accepted: boolean;
  liability_waiver_accepted: boolean;
  how_did_you_hear: string;
  resume_sharing_opt_in: boolean;
  email_opt_in: boolean;
  sms_opt_in: boolean;
}

export interface StepConfig {
  id: string;
  title: string;
  terminalLabel: string;
  suitIcon: string;
  validate: (form: FormState, resumeFile: File | null, isEditing: boolean) => string[];
}

export interface StepProps {
  form: FormState;
  updateField: (field: string, value: string | boolean) => void;
  errors: string[];
}

export const YEAR_OPTIONS = ['freshman', 'sophomore', 'junior', 'senior', 'grad'];
export const EXPERIENCE_OPTIONS = ['beginner', 'intermediate', 'advanced'];
export const TSHIRT_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export const STEPS: StepConfig[] = [
  {
    id: 'basics',
    title: 'The Basics',
    terminalLabel: '> ACADEMIC_INFO',
    suitIcon: '\u2660',
    validate: (form) => {
      const errors: string[] = [];
      if (!form.university.trim()) errors.push('University is required');
      if (!form.major.trim()) errors.push('Major is required');
      if (!form.year_of_study) errors.push('Year of study is required');
      return errors;
    },
  },
  {
    id: 'contact',
    title: 'Contact Info',
    terminalLabel: '> CONTACT_INFO',
    suitIcon: '\u2666',
    validate: (form) => {
      const errors: string[] = [];
      if (!form.phone_number.trim()) errors.push('Phone number is required');
      if (!form.email.trim()) errors.push('Email is required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errors.push('Enter a valid email address');
      return errors;
    },
  },
  {
    id: 'profile',
    title: 'Your Profile',
    terminalLabel: '> YOUR_PROFILE',
    suitIcon: '\u2663',
    validate: (form, resumeFile, isEditing) => {
      const errors: string[] = [];
      if (!form.experience_level) errors.push('Experience level is required');
      if (!isEditing && !form.resume_url && !resumeFile)
        errors.push('Resume is required');
      if (form.github_url && !isValidUrl(form.github_url))
        errors.push('Enter a valid GitHub URL');
      if (form.linkedin_url && !isValidUrl(form.linkedin_url))
        errors.push('Enter a valid LinkedIn URL');
      return errors;
    },
  },
  {
    id: 'motivation',
    title: 'Tell Us More',
    terminalLabel: '> TELL_US_MORE',
    suitIcon: '\u2665',
    validate: (form) => {
      const errors: string[] = [];
      if (!form.why_attend.trim()) errors.push('This field is required');
      else if (form.why_attend.trim().length < 50)
        errors.push(`Need at least 50 characters (${form.why_attend.trim().length} so far)`);
      else if (form.why_attend.trim().length > 1000)
        errors.push('Maximum 1000 characters');
      return errors;
    },
  },
  {
    id: 'logistics',
    title: 'Almost Done',
    terminalLabel: '> LOGISTICS_&_PREFERENCES',
    suitIcon: '\u2660',
    validate: (form) => {
      const errors: string[] = [];
      if (!form.tshirt_size) errors.push('T-shirt size is required');
      return errors;
    },
  },
  {
    id: 'review',
    title: 'Review & Submit',
    terminalLabel: '> REVIEW_&_SUBMIT',
    suitIcon: '\u2666',
    validate: (form) => {
      const errors: string[] = [];
      if (!form.age_confirmed) errors.push('You must confirm you are 18+');
      if (!form.code_of_conduct_accepted)
        errors.push('You must accept the Code of Conduct');
      if (!form.liability_waiver_accepted)
        errors.push('You must accept the Liability Waiver');
      return errors;
    },
  },
];

export function getInitialFormState(initialData?: ApplicationData): FormState {
  return {
    university: initialData?.university ?? '',
    major: initialData?.major ?? '',
    year_of_study: initialData?.year_of_study ?? '',
    graduation_date: initialData?.graduation_date ?? '',
    phone_number: initialData?.phone_number ?? '',
    email: initialData?.email ?? '',
    resume_url: initialData?.resume_url ?? '',
    github_url: initialData?.github_url ?? '',
    linkedin_url: initialData?.linkedin_url ?? '',
    why_attend: initialData?.why_attend ?? '',
    experience_level: initialData?.experience_level ?? '',
    dietary_restrictions: initialData?.dietary_restrictions ?? '',
    tshirt_size: initialData?.tshirt_size ?? '',
    age_confirmed: initialData?.age_confirmed ?? false,
    code_of_conduct_accepted: initialData?.code_of_conduct_accepted ?? false,
    liability_waiver_accepted: initialData?.liability_waiver_accepted ?? false,
    how_did_you_hear: initialData?.how_did_you_hear ?? '',
    resume_sharing_opt_in: initialData?.resume_sharing_opt_in ?? false,
    email_opt_in: initialData?.email_opt_in ?? false,
    sms_opt_in: initialData?.sms_opt_in ?? false,
  };
}
