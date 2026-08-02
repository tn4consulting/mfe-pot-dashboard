import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PAYMENT_HISTORY_API_CLIENT, Payment } from 'dashboard-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth';

@Component({
  selector: 'lib-dashboard-feature-payment-history',
  imports: [CommonModule],
  templateUrl: './dashboard-feature-payment-history.html',
  styleUrl: './dashboard-feature-payment-history.css',
})
export class DashboardFeaturePaymentHistory implements OnInit {
  private readonly apiClient = inject(PAYMENT_HISTORY_API_CLIENT);

  protected readonly payments = signal<Payment[]>([]);
  protected readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    const session = getStoredSession();
    if (!session) {
      this.loadError.set(true);
      return;
    }
    try {
      this.payments.set(await this.apiClient.getPayments(session.sub));
    } catch (err) {
      console.error('Failed to load payment history', err);
      this.loadError.set(true);
    }
  }
}
