import { withNativeFederation } from '@angular-architects/native-federation/config';
import {
  sharedFederationDependencies,
  sharedFederationFeatures,
  sharedFederationSkip,
} from '@tn4consulting/shared-federation-config';

export default withNativeFederation({
  name: 'dashboard',

  exposes: {
    './Component': './apps/dashboard/src/app/app.ts',
    './PaymentHistoryWidget': './libs/feature-payment-history/src/index.ts',
    './RemoteProviders': './apps/dashboard/src/app/remote-providers.ts',
  },

  shared: sharedFederationDependencies,
  skip: sharedFederationSkip,

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: sharedFederationFeatures,
});
