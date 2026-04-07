import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SubscriptionPageClient from './subscription-client';

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <SubscriptionPageClient />
    </Suspense>
  );
}
