import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h1>Orders</h1>
      <p class="text-secondary">Real-time order monitoring and management</p>
      <div class="card" style="margin-top: 24px;">
        <p>Order management module - Coming soon with full order tracking, status updates, and management features.</p>
      </div>
    </div>
  `
})
export class OrdersComponent {}
