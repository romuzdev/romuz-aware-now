-- Gate-G: Documents Hub v1 - Part 2.1.1
-- Enable RLS on new tables

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on document_versions table
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on attachments table
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;