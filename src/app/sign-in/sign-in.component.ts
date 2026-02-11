import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IUser, SupabaseService } from '../supabase.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent {

  loading: boolean;
  user: IUser;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    this.loading = false;
    this.user = {} as IUser;
  }

  public signIn(): void {
    this.loading = true;

    this.supabaseService
      .signIn(this.user.email, this.user.password)
      .then(() => {
        // ✅ sucesso
        this.loading = false;
        this.router.navigate(['/profile']);
      })
      .catch((error) => {
        // ❌ erro
        console.error(error);
        this.loading = false;
        alert('Erro ao fazer login');
      });
  }
}
