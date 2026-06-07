import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <div class="logo">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
              <path d="M16 8L20 12H18V18H14V12H12L16 8Z" fill="white"/>
              <path d="M12 20H20V22H12V20Z" fill="white"/>
            </svg>
          </div>
          <h1>NearBite</h1>
          <p>Admin Console</p>
        </div>
        
        <form class="login-form" (ngSubmit)="login()">
          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
          
          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              class="form-input"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@nearbite.com"
              required
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-input"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
          
          <div class="demo-credentials">
            <p class="text-sm text-secondary">Demo Credentials:</p>
            <p class="text-xs font-mono">admin@nearbite.com (any password)</p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
      padding: var(--space-xl);
    }
    
    .login-container {
      width: 100%;
      max-width: 400px;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: var(--space-xl);
      
      .logo {
        display: flex;
        justify-content: center;
        margin-bottom: var(--space-lg);
      }
      
      h1 {
        font-size: 32px;
        margin-bottom: var(--space-xs);
        color: var(--color-text-primary);
      }
      
      p {
        font-size: 14px;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }
    
    .login-form {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: var(--space-xl);
    }
    
    .error-message {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error);
      color: var(--color-error);
      padding: var(--space-md);
      border-radius: 4px;
      margin-bottom: var(--space-lg);
      font-size: 13px;
    }
    
    .btn-block {
      width: 100%;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .demo-credentials {
      margin-top: var(--space-lg);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border);
      text-align: center;
      
      p {
        margin-bottom: var(--space-xs);
      }
    }

    @media (max-width: 480px) {
      .login-page { padding: var(--space-md); }
      .login-form { padding: var(--space-lg); }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.loading = true;
    this.error = '';
    
    this.authService.login(this.email, this.password).subscribe(result => {
      this.loading = false;
      
      if (result.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = result.error || 'Login failed';
      }
    });
  }
}
