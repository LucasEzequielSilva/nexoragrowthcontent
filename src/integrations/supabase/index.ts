import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "placeholder";

// Import the actual client from the auto-generated file
export { supabase } from './client';
export type { Database };
