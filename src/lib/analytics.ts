import { supabase } from './supabase';

export type ConversionEvent =
  | 'homepage_view'
  | 'signup_cta_click'
  | 'signup_form_submitted'
  | 'signup_email_sent'
  | 'auth_completed'
  | 'project_submission_succeeded';

const ANON_KEY = 'nirauloom_analytics_visitor';

const getAnonymousId = (): string | null => {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

export const trackConversion = (event_name: ConversionEvent): void => {
  if (!supabase) return;
  const anonymous_id = getAnonymousId();
  const page_path = window.location.pathname;
  void supabase.from('conversion_events').insert({
    event_name,
    anonymous_id,
    page_path,
  }).then(({ error }) => {
    if (error) console.warn('Conversion event was not recorded:', error.message);
  });
};
