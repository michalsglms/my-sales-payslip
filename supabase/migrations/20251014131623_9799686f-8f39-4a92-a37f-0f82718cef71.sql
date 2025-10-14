-- Change work_excellence from boolean to numeric (0-100)
ALTER TABLE public.monthly_kpis
DROP COLUMN work_excellence;

ALTER TABLE public.monthly_kpis
ADD COLUMN work_excellence numeric DEFAULT 0 CHECK (work_excellence >= 0 AND work_excellence <= 100);