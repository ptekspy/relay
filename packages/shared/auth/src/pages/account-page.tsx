"use client";

import { useEffect, useState } from "react";
import { authUrl, signOut, useSession } from "../client";

export interface AccountPageProps {
  currentProduct?: "RELAY" | "MIRROR" | "WEARFOLIO" | "STRIDE";
  homeUrl?: string;
}

interface SubscriptionRecord {
  id: string;
  product: "RELAY" | "MIRROR" | "WEARFOLIO" | "STRIDE";
  tier: "FREE" | "STARTER" | "PRO" | "STUDIO" | "TEAM" | "BUSINESS";
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  isLocalOnly: boolean;
}

export function AccountPage({
  currentProduct,
  homeUrl = "/",
}: AccountPageProps) {
  const { data: sessionData, isPending } = useSession();
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch(`${authUrl}/api/subscriptions`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setSubscriptions(json.subscriptions || []);
        }
      } catch (err) {
        console.error("Failed to load subscriptions:", err);
      } finally {
        setLoadingSubs(false);
      }
    }

    if (sessionData?.user) {
      fetchSubscriptions();
    }
  }, [sessionData]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Loading Account...
      </div>
    );
  }

  if (!sessionData?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 font-mono">
        <div className="text-sm uppercase tracking-wider text-neutral-400">
          Authentication Required
        </div>
        <p className="text-xs text-neutral-600 max-w-sm text-center">
          You must be signed in to manage your Paddy Systems account and
          subscriptions.
        </p>
        <a
          href="/login"
          className="py-2.5 px-6 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors"
        >
          Sign In &rarr;
        </a>
      </div>
    );
  }

  const user = sessionData.user;

  const products: Array<{
    id: "RELAY" | "MIRROR" | "WEARFOLIO";
    name: string;
    description: string;
    localFeature: string;
    cloudFeature: string;
    upgradeUrl: string;
  }> = [
    {
      id: "RELAY",
      name: "Relay",
      description: "Low-latency WebRTC peer streaming & remote device control.",
      localFeature: "Full features, local network only",
      cloudFeature: "Global cloud signaling & live relay",
      upgradeUrl: "https://relay.paddy.systems/pricing",
    },
    {
      id: "MIRROR",
      name: "Mirror",
      description:
        "Distributed system sync, state mirroring & telemetry pipelines.",
      localFeature: "Full features, local storage only",
      cloudFeature: "Multi-cluster synchronization & cloud storage",
      upgradeUrl: "https://mirror.paddy.systems/pricing",
    },
    {
      id: "WEARFOLIO",
      name: "Wearfolio",
      description: "AI-powered wardrobe organization & outfit intelligence.",
      localFeature: "Full features, local catalog & on-device analysis",
      cloudFeature: "Cross-device sync & cloud intelligence",
      upgradeUrl: "https://wearfolio.paddy.systems",
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = homeUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={homeUrl}
            className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase font-bold text-white hover:opacity-80 transition-opacity"
          >
            <span className="inline-block w-2.5 h-2.5 bg-white" />
            <span>PADDY.SYSTEMS</span>
          </a>
          <span className="text-white/30 font-mono">/</span>
          <span className="font-mono text-xs uppercase tracking-wider text-white/70">
            Account Management
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Profile Card */}
        <div className="bg-neutral-950 border border-white/15 p-6 sm:p-8 relative">
          <div
            className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white"
            aria-hidden="true"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 border border-white/20 flex items-center justify-center font-mono text-xl font-bold uppercase text-white">
                {user.name ? user.name.slice(0, 2) : user.email.slice(0, 2)}
              </div>
              <div>
                <h1 className="text-lg font-bold uppercase tracking-tight font-mono">
                  {user.name || "Paddy Systems User"}
                </h1>
                <p className="text-xs font-mono text-neutral-400 mt-0.5">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-white/10 text-neutral-300 border border-white/10">
                    ID: {user.id.slice(0, 12)}...
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active Account
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right w-full sm:w-auto">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Single Identity
              </span>
              <span className="text-xs font-mono text-neutral-300">
                1 Account for All Products
              </span>
            </div>
          </div>
        </div>

        {/* Product Subscriptions Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
                Platform Subscriptions
              </h2>
              <p className="text-xs font-mono text-neutral-400 mt-0.5">
                Every app starts with a full-featured local subscription. Cloud
                upgrades apply per platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {loadingSubs ? (
              <div className="col-span-full py-8 text-center text-xs font-mono text-neutral-500 uppercase tracking-wider">
                Loading subscriptions...
              </div>
            ) : (
              products.map((prod) => {
                const activeSub = subscriptions.find(
                  (s) => s.product === prod.id,
                );
                const isCurrent = currentProduct === prod.id;
                const isPaid =
                  activeSub &&
                  activeSub.tier !== "FREE" &&
                  activeSub.status === "ACTIVE";

                return (
                  <div
                    key={prod.id}
                    className={`bg-neutral-950 border p-5 flex flex-col justify-between relative transition-colors ${
                      isCurrent
                        ? "border-white bg-neutral-900/60"
                        : "border-white/15"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 right-4 bg-white text-black text-[9px] font-mono uppercase px-2 py-0.5 font-bold tracking-wider">
                        Current App
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-mono text-base font-bold uppercase tracking-wider">
                          {prod.name}
                        </h3>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 font-semibold tracking-wider ${
                            isPaid
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/10 text-neutral-300 border border-white/20"
                          }`}
                        >
                          {isPaid ? activeSub.tier : "Free (Local Only)"}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="border-t border-white/10 pt-3 space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-2 text-neutral-300">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span className="text-[11px]">
                            {prod.localFeature}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400">
                          <span
                            className={
                              isPaid
                                ? "text-emerald-400 font-bold"
                                : "text-neutral-600 font-bold"
                            }
                          >
                            {isPaid ? "✓" : "○"}
                          </span>
                          <span className="text-[11px]">
                            {prod.cloudFeature}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <a
                        href={prod.upgradeUrl}
                        className={`block text-center py-2 px-3 text-xs font-mono uppercase tracking-wider font-bold transition-colors ${
                          isPaid
                            ? "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                            : "bg-white text-black hover:bg-neutral-200"
                        }`}
                      >
                        {isPaid
                          ? "Manage Subscription ↗"
                          : "Upgrade to Cloud ↗"}
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Developer & CLI Access */}
        <section className="bg-neutral-950 border border-white/15 p-6 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono">
              CLI & Mobile Sign-In
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">
              Authenticate developer terminal tools and mobile companion apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="border border-white/10 p-4 space-y-2 bg-black">
              <span className="text-neutral-400 uppercase text-[10px] tracking-wider block">
                Relay / Paddy CLI
              </span>
              <p className="text-neutral-300 text-[11px]">
                Run the command below in your terminal to authenticate your
                local machine:
              </p>
              <div className="bg-neutral-900 border border-white/10 p-2.5 text-neutral-200 select-all">
                <code>paddy login</code>
              </div>
            </div>

            <div className="border border-white/10 p-4 space-y-2 bg-black">
              <span className="text-neutral-400 uppercase text-[10px] tracking-wider block">
                Android App Pairing
              </span>
              <p className="text-neutral-300 text-[11px]">
                Open the Paddy Systems or Relay Android app and tap &quot;Sign
                in with Browser&quot; to authorize via your unified account.
              </p>
              <div className="text-[11px] text-emerald-400">
                Single sign-on supported across all devices.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-6 mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-500">
        <div>&copy; {new Date().getFullYear()} Paddy Systems Inc.</div>
        <div className="flex gap-4">
          <a
            href="https://paddy.systems"
            className="hover:text-white transition-colors"
          >
            Platform
          </a>
          <a
            href="https://auth.paddy.systems"
            className="hover:text-white transition-colors"
          >
            Auth Status
          </a>
        </div>
      </footer>
    </div>
  );
}
