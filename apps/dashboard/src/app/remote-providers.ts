import { provideMfeTransloco } from '@tn4consulting/shared-i18n';
import {
  BENEFIT_OVERVIEW_API_CLIENT,
  HttpBenefitOverviewApiClient,
  HttpPaymentHistoryApiClient,
  PAYMENT_HISTORY_API_CLIENT,
} from 'dashboard-data-access';
import { runtimeConfig } from '../runtime-config';

// Split across two statements deliberately: Vite/esbuild specially
// recognize the inline pattern `new URL('...', import.meta.url)` and
// rewrite it for static asset bundling, which hijacks this computation in
// dev mode (it resolves to a dev-server /@fs/ disk path instead of this
// remote's actual serving origin). Storing import.meta.url first avoids
// that -- see apps/shell/src/app/app.config.ts for the fuller story.
const moduleUrl = import.meta.url;
const assetBaseUrl = new URL('.', moduleUrl).href;

export const REMOTE_PROVIDERS = [
  ...provideMfeTransloco(assetBaseUrl),
  {
    provide: BENEFIT_OVERVIEW_API_CLIENT,
    useValue: new HttpBenefitOverviewApiClient(runtimeConfig.benefitAggregationBffBaseUrl),
  },
  {
    provide: PAYMENT_HISTORY_API_CLIENT,
    useValue: new HttpPaymentHistoryApiClient(runtimeConfig.clientProfileServiceBaseUrl),
  },
];
