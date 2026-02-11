import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { environment } from '../environments/environment';

export interface IUser {
  email: string;
  name: string;
  website: string;
  url: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      environment.supabase.url,
      environment.supabase.key
    );
  }

  // =====================
  // AUTH
  // =====================

  async getUser(): Promise<User | null> {
    const { data } = await this.supabaseClient.auth.getUser();
    return data.user;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabaseClient.auth.getSession();
    return data.session;
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return this.supabaseClient.auth.onAuthStateChange(callback);
  }

  // Login (email + senha)
  signIn(email: string, password: string) {
    return this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
  }

  signOut() {
    return this.supabaseClient.auth.signOut();
  }

  // =====================
  // PROFILE
  // =====================

  async getProfile() {
    const user = await this.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    return this.supabaseClient
      .from('profiles')
      .select('username, website, avatar_url')
      .eq('id', user.id)
      .single();
  }

  async updateProfile(userUpdate: IUser) {
    const user = await this.getUser();

    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const update = {
      id: user.id,
      username: userUpdate.name,
      website: userUpdate.website,
      updated_at: new Date(),
    };

    return this.supabaseClient
      .from('profiles')
      .upsert(update);
  }

  async signUp(email: string, password: string, name?: string) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }

}
