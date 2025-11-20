-- Remove all audit triggers from knowledge tables temporarily
DROP TRIGGER IF EXISTS trg_knowledge_documents_changes ON public.knowledge_documents;
DROP TRIGGER IF EXISTS trg_knowledge_qa_changes ON public.knowledge_qa;
DROP TRIGGER IF EXISTS trg_knowledge_documents_audit ON public.knowledge_documents;
DROP TRIGGER IF EXISTS trg_knowledge_qa_audit ON public.knowledge_qa;