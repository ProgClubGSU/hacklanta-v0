/// <reference path="./clerk-types.d.ts" />

// Helper to get auth headers with Clerk token
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await window.Clerk?.session?.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ---------- Typed interfaces ----------

export interface Application {
  id: string;
  status: string;
  email: string;
  university: string;
  major: string;
  year_of_study: string;
  experience_level: string | null;
  why_attend: string | null;
  resume_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  dietary_restrictions: string | null;
  tshirt_size: string | null;
  phone_number: string | null;
  how_did_you_hear: string | null;
  graduation_date: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
    is_accepted: boolean;
    acceptance_sent_at: string | null;
  } | null;
}

export interface ApplicationsResponse {
  data: Application[];
  meta: { total: number; offset: number; limit: number };
}

export interface StatsData {
  total: number;
  by_status: Record<string, number>;
  teams_count: number;
  accepted_users: number;
  emails_sent: number;
}

export interface UpdateStatusResult {
  updated: number;
  emails_sent: number;
  emails_failed: number;
}

export interface EmailBlastResult {
  dry_run: boolean;
  recipient_count?: number;
  sample_emails?: string[];
  sent?: number;
  errors?: number;
  total?: number;
  errorDetails?: Array<{ email: string; error: string }>;
}

// ---------- API client ----------

export const adminApi = {
  async getApplications(params: {
    status?: string;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    offset?: number;
    limit?: number;
  }): Promise<ApplicationsResponse> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_dir) query.set('sort_dir', params.sort_dir);
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.limit !== undefined) query.set('limit', String(params.limit));

    const res = await fetch(`/api/admin/applications?${query.toString()}`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch applications: ${res.status}`);
    }
    return res.json();
  },

  async getStats(): Promise<StatsData> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/stats', { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.status}`);
    }
    return res.json();
  },

  async updateStatus(params: {
    application_ids?: string[];
    user_ids?: string[];
    new_status: string;
    send_email?: boolean;
  }): Promise<UpdateStatusResult> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/update-status', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to update status: ${res.status}`);
    }
    return res.json();
  },

  async sendEmailBlast(params: {
    subject: string;
    body: string;
    filters?: Record<string, unknown>;
    dry_run?: boolean;
  }): Promise<EmailBlastResult> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/email-blast', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error(`Failed to send email blast: ${res.status}`);
    }
    return res.json();
  },

  async sendAcceptanceEmails(): Promise<{ sent: number; errors: number; total: number }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/admin/accept-users', {
      method: 'POST',
      headers,
    });
    if (!res.ok) {
      throw new Error(`Failed to send acceptance emails: ${res.status}`);
    }
    return res.json();
  },
};
