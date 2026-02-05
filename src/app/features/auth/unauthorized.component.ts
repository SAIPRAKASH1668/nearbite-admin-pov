import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <h1>403</h1>
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <button class="btn btn-primary" routerLink="/dashboard">Back to Dashboard</button>
      </div>
    </div>
  `,
  styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .error-content h1 {
      font-size: 72px;
      color: var(--color-primary);
      margin-bottom: var(--space-lg);
    }
    
    .error-content h2 {
      margin-bottom: var(--space-md);
    }
    
    .error-content p {
      color: var(--color-text-secondary);
      margin-bottom: var(--space-xl);
    }
  `]
})
export class UnauthorizedComponent {}
