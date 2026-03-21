-- ============================================================
-- Hacklanta Initial Schema
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- USERS (synced from Clerk webhooks)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR UNIQUE NOT NULL,
    email VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    avatar_url VARCHAR,
    role VARCHAR DEFAULT 'user',
    is_accepted BOOLEAN DEFAULT false,
    acceptance_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (team finder profiles, one per user)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR NOT NULL,
    bio TEXT,
    linkedin_url VARCHAR,
    github_url VARCHAR,
    portfolio_url VARCHAR,
    looking_for_team BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS (from Tally form submissions)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tally_response_id VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending',
    email VARCHAR,
    university VARCHAR NOT NULL,
    major VARCHAR NOT NULL,
    year_of_study VARCHAR NOT NULL,
    graduation_date DATE,
    resume_url VARCHAR,
    github_url VARCHAR,
    linkedin_url VARCHAR,
    why_attend TEXT,
    experience_level VARCHAR,
    dietary_restrictions VARCHAR,
    tshirt_size VARCHAR,
    phone_number VARCHAR,
    how_did_you_hear VARCHAR,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    invite_code VARCHAR UNIQUE NOT NULL,
    max_size INT DEFAULT 4,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- TEAM JOIN REQUESTS
CREATE TABLE team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'pending',
    message TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_tally_response_id ON applications(tally_response_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_join_requests_team_id ON team_join_requests(team_id);
CREATE INDEX idx_team_join_requests_user_id ON team_join_requests(user_id);
CREATE INDEX idx_teams_invite_code ON teams(invite_code);
