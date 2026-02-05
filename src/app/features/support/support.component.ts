import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>Support Tickets</h1><div class="card" style="margin-top: 24px;"><p>Support ticket system - Coming soon</p></div></div>`
})
export class SupportComponent {}
