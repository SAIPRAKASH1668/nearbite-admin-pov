import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurants-pending',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>Pending Approvals</h1><div class="card" style="margin-top: 24px;"><p>Pending restaurant approvals - Coming soon</p></div></div>`
})
export class RestaurantsPendingComponent {}
