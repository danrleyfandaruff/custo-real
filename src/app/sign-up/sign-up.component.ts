import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {SupabaseService, IUser} from '../supabase.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {

  loading = false;

  user: { password: string; name: string; email: string } = {
    email: '',
    password: '',
    name: ''
  };

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
  }

  async signUp(): Promise<void> {
    this.loading = true;

    try {
      await this.supabaseService.signUp(
        this.user.email,
        this.user.password!,
        this.user.name
      );

      alert('Conta criada! Verifique seu email 📩');
      this.router.navigate(['/sign-in']);
    } catch (error) {
      alert('Erro ao criar conta');
      console.error(error);
    } finally {
      this.loading = false;
    }
  }
}
