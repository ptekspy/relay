"use client";

import TanstackQueryProvider from "@paddy-systems/lib/tanstack-query/TanstackQueryProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <TanstackQueryProvider>{children}</TanstackQueryProvider>;
}
