export const SUPABASE_URL = "https://zlgwkwdpswdnuuetzhle.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZ3drd2Rwc3dkbnV1ZXR6aGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTEyNjUsImV4cCI6MjA3MjAyNzI2NX0.cDTOhQUvBIw4PwqthRCP3Q_5pZUTq1nUEskWZvWVtMM";
export const ADMIN_PHONE = "9001641023";

export const getHeaders = () => ({
  'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
        });

        export const isContestLocked = (releaseDateStr) => {
          if (!releaseDateStr) return false;
            const lockTime = new Date(`${releaseDateStr}T00:00:00`).getTime();
              return new Date().getTime() >= lockTime;
              };
              