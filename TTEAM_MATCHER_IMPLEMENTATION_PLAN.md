# Hacklanta Implementation Plan: Zero-AWS & Team Matcher

This document outlines the steps to migrate away from AWS SES for emails and build a custom Team Matcher system.

## Phase 1: Zero-AWS Email Migration (Resend)

We are replacing AWS SES with **Resend** for transactional emails to reduce infrastructure complexity and cost (Free Tier: 3,000 emails/mo).

### 1.1 Install Dependencies

Add `resend` to the project dependencies in `services/api/pyproject.toml`.

```toml
dependencies = [
    # ... existing deps
    "resend>=0.8.0",
]
```

### 1.2 Configuration

Add the API key to `services/api/app/core/config.py` and `.env`.

**`services/api/app/core/config.py`**:

```python
class Settings(BaseSettings):
    # ...
    # Resend
    resend_api_key: str = ""
```

**`services/api/.env`**:

```bash
RESEND_API_KEY=re_123456789
```

### 1.3 Update Email Utility

Replace `services/api/app/utils/email.py` content to use Resend instead of Boto3.

---

## Phase 2: "Accept All" Workflow

Since we are accepting everyone who signs in, we need a script to bulk-email acceptance notifications.

### 2.1 Create Script

Create `services/api/scripts/accept_all_users.py`.

**Logic:**

1. Fetch all users from the `users` table.
2. Iterate through each user.
3. specific "Acceptance" email template via Resend.
4. (Optional) Mark them as "accepted" in a new `status` column if needed.

**Usage:**

```bash
cd services/api
uv run python scripts/accept_all_users.py
```

---

## Phase 3: Team Matcher System

We are building a custom internal system for participants to find teammates, independent of Tally.

### 3.1 Database Models

Create new domain `services/api/app/domains/teams`.

**New Tables:**

1.  **`profiles`**: Extended user info specific to gathering (Bio, Skills, "Looking for Team").
    - `user_id` (FK -> users.id)
    - `bio` (Text)
    - `skills` (Array of Strings or comma-separated)
    - `looking_for_team` (Boolean)
2.  **`teams`**: The teams themselves.
    - `name` (String)
    - `description` (Text)
    - `invite_code` (String, Unique) - for joining
3.  **`team_members`**: Link table.
    - `team_id` (FK)
    - `user_id` (FK)
    - `role` (Leader/Member)

### 3.2 API Endpoints

Create `services/api/app/domains/teams/router.py`.

| Method | Endpoint              | Description                                 |
| :----- | :-------------------- | :------------------------------------------ |
| `POST` | `/api/v1/profiles/me` | Create/Update current user's hacker profile |
| `GET`  | `/api/v1/profiles`    | List all users with `looking_for_team=True` |
| `POST` | `/api/v1/teams`       | Create a new team (User becomes Leader)     |
| `POST` | `/api/v1/teams/join`  | Join a team using an `invite_code`          |
| `GET`  | `/api/v1/teams/me`    | Get current user's team                     |

### 3.3 Frontend (Astro + React)

Create `apps/web/src/pages/dashboard/team.astro`.

**Features:**

- **Profile Editor:** Form to update Bio/Skills.
- **Team Browser:** Grid of users looking for teams.
- **Team Management:**
  - "Create Team" button.
  - "Join Team" input field (for invite codes).
  - List of current team members.

---

## Phase 4: Execution Order

1.  **Migration:** Update `email.py` and `pyproject.toml` (Switch to Resend).
2.  **Backend:** Create `teams` domain (Models, Repositories, Routers).
3.  **Database:** Generate and run Alembic migrations for new tables.
4.  **Script:** Run `accept_all_users.py` to notify existing users.
5.  **Frontend:** Build the Team Dashboard UI.
