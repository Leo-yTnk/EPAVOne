import { generateCredential } from './credential.js';
import { normalizeDisplayName } from './displayName.js';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/supabase.js';

export function credentialEmail(input) {
  let value = String(input || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '');
  if (value.length === 11 && value.startsWith('YCP')) value = value.slice(3);
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(value)) return null;
  return `ycp-${value.slice(0, 4).toLowerCase()}-${value.slice(4).toLowerCase()}@credential.yourcipe.local`;
}

export function createAccountService(client) {
  return {
    async signUp(displayName, password, confirmation, captchaToken) {
      const name = normalizeDisplayName(displayName);
      if (!name) throw new Error('Informe um nome entre 2 e 80 caracteres.');
      if (password.length < 6) throw new Error('Use uma senha com pelo menos 6 caracteres.');
      if (password !== confirmation) throw new Error('As senhas precisam ser iguais.');
      if (!captchaToken) throw new Error('Conclua a verificação de segurança.');
      const credential = generateCredential();
      // Exactly one request per token. A collision requires a new CAPTCHA.
      const { data, error } = await client.auth.signUp({
        email: credentialEmail(credential),
        password,
        options: { captchaToken, data: { credential, display_name: name } }
      });
      if (
        error?.code === 'user_already_exists' ||
        /already registered|already exists|user already/i.test(error?.message || '') ||
        (data?.user && Array.isArray(data.user.identities) && !data.user.identities.length)
      )
        throw new Error('Essa credencial já existe. Verifique novamente a segurança e tente criar a conta.');
      if (error?.code === 'captcha_failed') throw new Error('A verificação expirou. Verifique novamente a segurança.');
      if (error?.status === 429) throw new Error('Muitas tentativas. Aguarde um pouco e tente novamente.');
      if (error) throw new Error('Não foi possível criar a conta. Confira os dados e tente novamente.');
      if (!data?.user) throw new Error('O serviço não confirmou a criação. Tente novamente.');
      return { credential, session: data.session || null };
    },
    async signIn(credential, password, captchaToken) {
      const email = credentialEmail(credential);
      if (!email) throw new Error('Confira a credencial YCP informada.');
      if (!captchaToken) throw new Error('Conclua a verificação de segurança.');
      const { data, error } = await client.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (error) {
        if (error.code === 'captcha_failed') throw new Error('A verificação expirou. Tente novamente.');
        if (error.status === 429) throw new Error('Muitas tentativas. Aguarde um pouco e tente novamente.');
        throw new Error('Não foi possível entrar. Confira sua credencial e senha e tente novamente.');
      }
      return data.session;
    },
    async profile(userId, signal) {
      const { data, error } = await client
        .from('profiles')
        .select('display_name,role,catalog_card_layout')
        .eq('id', userId)
        .abortSignal(signal)
        .single();
      if (error) throw new Error('Não foi possível carregar seu perfil. Tente novamente.');
      return {
        displayName: data.display_name || null,
        role: data.role === 'admin' ? 'admin' : 'user',
        catalogCardLayout: data.catalog_card_layout
      };
    },
    subscribe(callback) {
      return client.auth.onAuthStateChange((_event, session) => callback(session)).data.subscription;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Não foi possível sair. Tente novamente.');
    }
  };
}

// Same SDK storage key as Yourcipe, under the same GitHub Pages origin.
export const authenticatedClient = createClient(supabaseConfig.url, supabaseConfig.key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  global: {
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        signal: options?.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000)
      })
  }
});
export const accountService = createAccountService(authenticatedClient);
