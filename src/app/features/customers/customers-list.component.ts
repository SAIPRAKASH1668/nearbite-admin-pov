import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>Customers</h1><div class="card" style="margin-top: 24px;"><p>Customer management - Coming soon</p></div></div>`
})
export class CustomersListComponent {}
