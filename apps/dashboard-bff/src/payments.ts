import { upstreams } from './config';

export interface Payment {
  id: string;
  date: string;
  benefit: string;
  program: string;
  status: 'pending' | 'complete';
  amount: number;
}

/**
 * client-profile-service has no Ingress route and no in-cluster DNS name
 * reachable from a browser -- it's BFF-only, per design (see CLAUDE.md's
 * "Backends: BFF pattern" section). This is the one server-to-server hop
 * standing in front of it for the standalone payment-history widget, mirroring
 * how overview.ts already proxies the same upstream for /api/overview.
 */
export async function getPayments(sub: string): Promise<Payment[]> {
  const response = await fetch(
    `${upstreams.clientProfileServiceUrl}/api/profile/${encodeURIComponent(sub)}/payments`,
  );
  if (!response.ok) {
    throw new Error(`client-profile-service returned ${response.status} for /payments`);
  }
  return (await response.json()) as Payment[];
}
