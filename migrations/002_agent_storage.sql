-- Migration: 002_agent_storage.sql
-- Date: 2026-02-20
-- Feature: Phase 1 Foundation - Agent Code Storage
-- Description: Add columns for tracking generated agent code storage and versioning

-- ============================================
-- ADD STORAGE COLUMNS TO PROJECTS TABLE
-- ============================================

-- local_path: Relative path to project folder (e.g., "923032206662@s.whatsapp.net/faq-bot")
ALTER TABLE projects ADD COLUMN IF NOT EXISTS local_path VARCHAR(500);

-- current_version: Version number of the latest generated code
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;

-- code_files: JSON array of generated file names for quick reference
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code_files JSONB DEFAULT '[]';

-- agent_type: Type of agent (standard, realtime, multi-agent)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50) DEFAULT 'standard';

-- slug: URL-safe project identifier for folder naming
ALTER TABLE projects ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- ============================================
-- ADD INDEX FOR FAST LOOKUPS
-- ============================================

-- Index for finding projects by local path
CREATE INDEX IF NOT EXISTS idx_projects_local_path ON projects(local_path);

-- Index for finding projects by slug within a client
CREATE INDEX IF NOT EXISTS idx_projects_client_slug ON projects(client_id, slug);

-- ============================================
-- VERIFY COLUMNS ADDED
-- ============================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('local_path', 'current_version', 'code_files', 'agent_type', 'slug');
