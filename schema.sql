-- ==========================================
-- Zingwangwa Hospital LIMS Supabase Schema
-- ==========================================

-- Drop table if exists (for re-initialization if needed)
-- DROP TABLE IF EXISTS lims_requests;

CREATE TABLE IF NOT EXISTS lims_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('TB', 'HIV')),
    sub_type VARCHAR(50) NOT NULL, -- e.g., 'GeneXpert Ultra', 'GeneXpert XDR', 'Urine LAM', 'Microscopy', 'Viral Load', 'EID'
    status VARCHAR(30) NOT NULL DEFAULT 'Pending Sample' CHECK (status IN ('Pending Sample', 'Sample Received', 'Testing', 'Completed')),
    clinician_email VARCHAR(255) NOT NULL, -- The requesting clinician's email (e.g. clinitian@zg.com, tb@zg.com)
    patient_name VARCHAR(255) NOT NULL,
    patient_id VARCHAR(100), -- ART number for HIV, TB treatment register number for TB, etc.
    patient_phone VARCHAR(50), -- Clinician/Guardian phone for SMS notification
    
    -- Structured JSON payloads for rich forms
    patient_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    results_uploaded_at TIMESTAMP WITH TIME ZONE,
    results_uploaded_by VARCHAR(255)
);

-- Indices for rapid querying and search
CREATE INDEX IF NOT EXISTS idx_lims_requests_type ON lims_requests(type);
CREATE INDEX IF NOT EXISTS idx_lims_requests_status ON lims_requests(status);
CREATE INDEX IF NOT EXISTS idx_lims_requests_clinician ON lims_requests(clinician_email);
CREATE INDEX IF NOT EXISTS idx_lims_requests_patient_name ON lims_requests(patient_name);
CREATE INDEX IF NOT EXISTS idx_lims_requests_patient_id ON lims_requests(patient_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lims_requests_updated_at
    BEFORE UPDATE ON lims_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE lims_requests ENABLE ROW LEVEL SECURITY;

-- 1. Clinicians can create request records
CREATE POLICY "Clinicians can insert requests" ON lims_requests
    FOR INSERT
    WITH CHECK (true); -- In a production setup, check: auth.role() = 'authenticated'

-- 2. Clinicians can view requests they or their department submitted
CREATE POLICY "Clinicians can view their own requests" ON lims_requests
    FOR SELECT
    USING (
        -- Clinicians can see requests from their own email or general department matching
        clinician_email = auth.jwt() ->> 'email'
        OR (auth.jwt() ->> 'email' = 'clinitian@zg.com' AND clinician_email LIKE '%zg.com')
        OR (auth.jwt() ->> 'email' = 'tb@zg.com' AND clinician_email = 'tb@zg.com')
        OR (auth.jwt() ->> 'email' = 'moghajoh@gmail.com') -- Lab technicians can see all
    );

-- 3. Lab Technicians can view all requests and update status & results
CREATE POLICY "Lab Technicians have full update access" ON lims_requests
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' = 'moghajoh@gmail.com' 
        OR clinician_email = auth.jwt() ->> 'email'
    )
    WITH CHECK (true);

-- ==========================================
-- SUPABASE REALTIME
-- ==========================================
-- Enable Supabase Realtime CDC for this table so that the app's
-- postgres_changes subscription receives INSERT / UPDATE / DELETE events.
-- Run this ONCE in the Supabase SQL Editor after creating the table.
ALTER PUBLICATION supabase_realtime ADD TABLE lims_requests;

-- ==========================================
-- AFRICASTALKING SMS TRIGGER GUIDELINES
-- ==========================================
/*
To deploy a real-time SMS trigger in Supabase:
1. Create a Supabase Database Webhook or Edge Function that listens for updates to 'lims_requests'.
2. When the status transitions to 'Completed', extract the patient_name, patient_phone, and lab results summary.
3. Call the AfricasTalking SMS API using your API credentials:
   
   - API Endpoint: https://api.africastalking.com/version1/messaging
   - Header: apiKey: YOUR_AFRICASTALKING_API_KEY
   - POST Parameters:
       username: YOUR_USERNAME (typically 'sandbox' for testing)
       to: patient_phone (or clinician phone)
       message: "Zingwangwa LIMS: Results for [Patient Name] are ready. Status: [Results Summary]. Please check your portal."
*/
