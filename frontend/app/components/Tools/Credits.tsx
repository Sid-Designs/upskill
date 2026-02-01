"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import api from "@/lib/api";
import { 
  Coins, 
  Zap, 
  Star, 
  Crown, 
  CheckCircle, 
  Loader2, 
  X, 
  RefreshCw, 
  Sparkles,
  Calendar,
  TrendingUp
} from "lucide-react";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Credit packages configuration
const creditPackages = [
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    price: 20,
    pricePerCredit: "₹1.00",
    icon: Zap,
    iconBg: "bg-blue-500",
    iconShadow: "shadow-blue-500/25",
    popular: false,
    savings: null,
    description: "Great for trying out",
  },
  {
    id: "popular",
    name: "Popular",
    credits: 50,
    price: 45,
    originalPrice: 50,
    pricePerCredit: "₹0.90",
    icon: Star,
    iconBg: "bg-[var(--color-primary)]",
    iconShadow: "shadow-[var(--color-primary)]/25",
    popular: true,
    savings: "10%",
    description: "Best for regular users",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 100,
    price: 80,
    originalPrice: 100,
    pricePerCredit: "₹0.80",
    icon: Crown,
    iconBg: "bg-amber-500",
    iconShadow: "shadow-amber-500/25",
    popular: false,
    savings: "20%",
    description: "Maximum value pack",
  },
];

const Credits = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => setError("Failed to load payment gateway");
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Fetch current credits
  const fetchCredits = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await api.get("/api/profile/get");
      setCurrentCredits(response.data.credits ?? 0);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setCurrentCredits(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".credits-hero", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4 }
      );
      gsap.fromTo(".credits-stats", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.1 }
      );
      gsap.fromTo(".credits-content", 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, { scope: containerRef });

  // Handle purchase
  const handlePurchase = async (packageId: string) => {
    const selectedPackage = creditPackages.find((p) => p.id === packageId);
    if (!selectedPackage) return;

    if (!razorpayLoaded) {
      setError("Payment gateway is loading. Please try again.");
      return;
    }

    setPurchasing(packageId);
    setError(null);
    setSuccess(null);

    try {
      const orderResponse = await api.post("/api/payment/create-order", {
        amount: selectedPackage.price,
        creditsToAdd: selectedPackage.credits,
      });

      const { orderId, keyId, amount, currency } = orderResponse.data;

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: currency,
        name: "UpSkill AI",
        description: `${selectedPackage.credits} Credits - ${selectedPackage.name} Package`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyResponse = await api.post("/api/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyResponse.data.verified) {
              setSuccess(`Successfully purchased ${selectedPackage.credits} credits!`);
              fetchCredits();
            }
          } catch (verifyError) {
            setSuccess("Payment successful! Credits will be added shortly.");
            setTimeout(() => fetchCredits(), 3000);
          }
        },
        prefill: {},
        theme: { color: "#7C3AED" },
        modal: {
          ondismiss: function () {
            setPurchasing(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setPurchasing(null);
      });
      razorpay.open();
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.response?.data?.error || "Failed to initiate payment");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full pb-6 space-y-6">
      {/* Hero Header */}
      <div className="credits-hero relative overflow-hidden bg-[var(--color-primary)] rounded-2xl p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <Coins className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Credits Store</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Purchase Credits
              </h1>
              <p className="text-white/70 max-w-xl leading-relaxed">
                Power up your AI experience with credits. Use them for chat, cover letters, and more!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="credits-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Credits</p>
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{currentCredits?.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>

        <div className="credits-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Best Value</p>
              <p className="text-2xl font-bold text-gray-900">20% Off</p>
            </div>
          </div>
        </div>

        <div className="credits-stats bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Validity</p>
              <p className="text-2xl font-bold text-gray-900">Lifetime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900">{success}</p>
            <p className="text-sm text-emerald-700">Your balance has been updated.</p>
          </div>
          <button onClick={() => setSuccess(null)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-rose-900">Payment Failed</p>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Credit Packages */}
      <div className="credits-content bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Choose a Package</h2>
              <p className="text-sm text-gray-500">Select the credit package that suits your needs</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`group p-6 hover:bg-gray-50 transition-all duration-200 ${pkg.popular ? 'bg-[var(--color-primary)]/[0.02]' : ''}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`h-12 w-12 rounded-xl ${pkg.iconBg} text-white flex items-center justify-center shadow-lg ${pkg.iconShadow} flex-shrink-0`}>
                    <pkg.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pkg.name}
                      </h3>
                      {pkg.popular && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                          Most Popular
                        </span>
                      )}
                      {pkg.savings && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Save {pkg.savings}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-gray-900">{pkg.credits} Credits</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span>{pkg.pricePerCredit}/credit</span>
                      </div>
                      
                      <span className="text-gray-400">{pkg.description}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">₹{pkg.price}</span>
                      {pkg.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{pkg.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing !== null}
                    className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                      pkg.popular
                        ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 shadow-lg shadow-[var(--color-primary)]/25"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchasing === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        <span className="hidden sm:inline">Buy Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Never Expires</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;
