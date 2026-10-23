import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

/** Test data is tagged with this e-mail prefix so teardown can find and remove all of it. */
export const E2E_TAG = 'e2e-';
export const E2E_QUIZ_PIN = 'E2ETST';
export const STATE_FILE = path.join(__dirname, '.state.json');

export interface E2EState {
  runId: string;
  admin: { id: string; email: string; password: string };
  teacher: { id: string; email: string; password: string };
  student?: { matricNo: string; email: string; id?: string };
  /** Original quiz/class-code settings, restored in teardown. */
  restore?: {
    quizzes: Array<{ id: string; is_open: boolean; session_pin: string | null }>;
    classCodes: Array<{ id: string; is_open: boolean }>;
  };
}

function loadEnvFile(file = '.env.local'): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

export function testEnv() {
  const file = loadEnvFile();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || file.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || file.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('E2E needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (staging project) in .env.local or the environment.');
  }
  return { url, serviceKey };
}

/** Service-role client for the STAGING project. Refuses to run if it looks like production. */
export function adminClient(): SupabaseClient {
  const { url, serviceKey } = testEnv();
  // Never run against the dedicated production project (its keys live in private/env/production.env).
  const prod = loadEnvFile('private/env/production.env').NEXT_PUBLIC_SUPABASE_URL;
  if (prod && new URL(prod).host === new URL(url).host) {
    throw new Error('Refusing to run E2E tests against the production project.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function readState(): E2EState {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as E2EState;
}

export function writeState(state: E2EState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function newPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

/** A tiny valid JPEG (starts with the FFD8FF magic bytes the server checks). */
export const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

/** Signs a staff member in through the real login page. */
export async function loginAs(page: Page, who: { email: string; password: string }, redirect = '/admin/gradebook') {
  await page.context().clearCookies();
  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type=email]').fill(who.email);
  await page.locator('input[type=password]').fill(who.password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20_000 });
}

/** Fills and submits the public registration form. */
export async function fillRegistration(page: Page, opts: { email: string; first: string; surname: string; withPhoto?: boolean }) {
  await page.goto('/register');
  await page.waitForLoadState('networkidle');
  await page.locator('[name=surname]').fill(opts.surname);
  await page.locator('[name=first_name]').fill(opts.first);
  await page.locator('[name=gender]').selectOption('Male');
  await page.locator('[name=marital_status]').selectOption('Single');
  await page.locator('[name=phone_number]').fill('08000000000');
  await page.locator('[name=email_address]').fill(opts.email);
  await page.locator('[name=born_again]').selectOption('Yes');
  await page.locator('[name=baptised_hs]').selectOption('Yes');
  await page.locator('[name=attended_mem_vision]').selectOption('Yes');
  await page.locator('[name=committed_to_programme]').selectOption('Yes');
  if (opts.withPhoto) {
    await page.locator('input[type=file]').setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: TINY_JPEG });
  }
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: /Complete Registration/i }).click();
}
