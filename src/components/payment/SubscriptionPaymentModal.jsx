import { useState, useEffect } from "react";
import {
  QrCode,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  createCardOrder,
  verifyCardPayment,
  verifyUpiPayment,
  cancelPayment,
} from "@/services/paymentService";

export function SubscriptionPaymentModal({
  open,
  onClose,
  plan,
  onSuccess,
  userId,
  hospitalId,
}) {
  const [method, setMethod] = useState("upi"); // "upi" | "card"
  const [step, setStep] = useState("select"); // "select" | "success" | "failed"
  const [utr, setUtr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gatewayNotice, setGatewayNotice] = useState(null);
  const [verifiedData, setVerifiedData] = useState(null);

  // Reset state on open/close
  useEffect(() => {
    if (open) {
      setStep("select");
      setMethod("upi");
      setUtr("");
      setErrorMessage("");
      setGatewayNotice(null);
      setVerifiedData(null);
      setLoading(false);
    }
  }, [open, plan]);

  if (!open || !plan) return null;

  const UPI_ID = "pamraghvendra12-7@oksbi";
  const PAYEE_NAME = "Raghvendra Pandey";

  const handleCopyUpi = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(UPI_ID);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleUpiVerification = async (e) => {
    e?.preventDefault();
    const cleanUtr = utr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage("Please enter a valid 12-digit UPI Transaction Reference Number (UTR).");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await verifyUpiPayment({
        plan: plan.name,
        amount: plan.price,
        utr: cleanUtr,
        userId,
        hospitalId,
      });

      if (response?.data?.status === "active" || response?.success) {
        setVerifiedData({
          plan: plan.name,
          amount: plan.priceDisplay || `₹${plan.price}`,
          reference: cleanUtr,
          gateway: "UPI Payment",
          expiryDate: response?.data?.expiryDate || "30 Days from today",
          status: "Active & Monitored",
        });
        setStep("success");
        if (onSuccess) onSuccess(response.data);
      } else {
        setErrorMessage(response?.error?.message || "UPI verification could not be completed.");
        setStep("failed");
      }
    } catch (err) {
      console.error("[UPI Payment Error]", err);
      setErrorMessage(
        err?.message || "Verification failed. Please check the Reference Number or try again."
      );
      setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    setLoading(true);
    setErrorMessage("");
    setGatewayNotice(null);

    try {
      const orderRes = await createCardOrder({
        plan: plan.name,
        amount: plan.price,
        currency: "INR",
        userId,
        hospitalId,
      });

      const orderData = orderRes?.data;

      // If Razorpay gateway credentials are not configured in backend .env:
      if (!orderData?.configured) {
        setGatewayNotice(
          orderData?.message ||
            "Payment Gateway credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured in environment variables. Real payment gateway integration requires live credentials."
        );
        setLoading(false);
        return;
      }

      // If configured, load Razorpay standard checkout
      if (typeof window === "undefined") return;

      const loadScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load card payment gateway checkout script.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "MediKiosk Healthcare",
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setLoading(true);
            const verifyRes = await verifyCardPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.name,
              amount: plan.price,
              userId,
              hospitalId,
            });

            if (verifyRes?.success) {
              setVerifiedData({
                plan: plan.name,
                amount: plan.priceDisplay || `₹${plan.price}`,
                reference: response.razorpay_payment_id,
                gateway: "Card Payment (Razorpay)",
                expiryDate: verifyRes?.data?.expiryDate || "30 Days from today",
                status: "Active & Monitored",
              });
              setStep("success");
              if (onSuccess) onSuccess(verifyRes.data);
            } else {
              setErrorMessage("Card payment signature verification failed.");
              setStep("failed");
            }
          } catch (vErr) {
            setErrorMessage(vErr?.message || "Payment verification failed.");
            setStep("failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setLoading(false);
            setErrorMessage("Payment was cancelled before completion.");
            setStep("failed");
            await cancelPayment({ orderId: orderData.orderId, reason: "User cancelled modal" }).catch(
              () => {}
            );
          },
        },
        theme: {
          color: "#059669",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setErrorMessage(resp.error?.description || "Card payment transaction failed.");
        setStep("failed");
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("[Card Payment Error]", err);
      setErrorMessage(err?.message || "Failed to initiate card payment.");
      setStep("failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Subscription Checkout"
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-2xl transition-all max-h-[92vh] overflow-y-auto",
          "dark:border-zinc-800 dark:bg-zinc-900"
        )}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── STEP 1: PAYMENT METHOD SELECTION ─────────────── */}
        {step === "select" && (
          <div>
            {/* Header / Selected Plan Summary */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Hospital Subscription Checkout
              </span>
              <div className="flex items-baseline justify-between gap-3 mt-1">
                <div>
                  <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {plan.name}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Assisted OPD kiosk fleet, live queue & doctor workstation
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {plan.priceDisplay || `₹${plan.price}`}
                  </span>
                  <span className="block text-xs font-semibold text-zinc-400">/ month</span>
                </div>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div className="mt-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setMethod("upi");
                    setErrorMessage("");
                    setGatewayNotice(null);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all",
                    method === "upi"
                      ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  <QrCode className="h-4 w-4" />
                  UPI Payment (QR)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("card");
                    setErrorMessage("");
                    setGatewayNotice(null);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all",
                    method === "card"
                      ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  <CreditCard className="h-4 w-4" />
                  Card Payment
                </button>
              </div>
            </div>

            {/* ── UPI SCREEN ─────────────────────────────── */}
            {method === "upi" && (
              <div className="mt-5 space-y-4">
                {/* Provided QR Code Display */}
                <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-50/40 p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-950/20">
                  <div className="relative rounded-xl border border-zinc-200 bg-white p-2.5 shadow-md dark:border-zinc-700">
                    <img
                      src="/upi-qr.jpg"
                      alt="UPI QR Code - Raghvendra Pandey"
                      className="h-44 w-44 object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback to assets path if public root path differs
                        e.currentTarget.src = "./src/assets/upi-qr.jpg";
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Scan to pay with any UPI app
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Google Pay, PhonePe, Paytm, BHIM, Cred, Banking UPI
                  </p>

                  {/* UPI Details Box */}
                  <div className="mt-3 w-full rounded-xl border border-emerald-200 bg-white/90 p-2.5 dark:border-emerald-900/60 dark:bg-zinc-900/90 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Payee Name:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {PAYEE_NAME}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">UPI ID:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {UPI_ID}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                      <span className="text-zinc-500">Amount to Transfer:</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {plan.priceDisplay || `₹${plan.price}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Status / Reference Form */}
                <form onSubmit={handleUpiVerification} className="space-y-3">
                  <div>
                    <label
                      htmlFor="utr-input"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1"
                    >
                      Transaction Reference / UTR Number
                    </label>
                    <input
                      id="utr-input"
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter 12-digit UTR from your UPI receipt"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      required
                    />
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Payment is verified against the reference number before activating your subscription.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-1/3 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !utr.trim()}
                      className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Activate
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── CARD PAYMENT SCREEN ──────────────────────── */}
            {method === "card" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Secure PCI-DSS Compliant Payment Gateway
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    We use production-grade payment gateway checkout (Razorpay). Sensitive card credentials, CVVs, and PINs are encrypted and never stored on our servers.
                  </p>

                  <div className="mt-3.5 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 text-xs space-y-1.5">
                    <div className="flex justify-between text-zinc-500">
                      <span>Plan Subscription:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Billing Term:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">Monthly</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      <span>Total Due:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {plan.priceDisplay || `₹${plan.price}`}
                      </span>
                    </div>
                  </div>
                </div>

                {gatewayNotice && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      Live Gateway Setup Required
                    </div>
                    <p className="leading-relaxed">
                      {gatewayNotice}
                    </p>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                      To complete live card testing, add <code className="font-mono font-bold">RAZORPAY_KEY_ID</code> and <code className="font-mono font-bold">RAZORPAY_KEY_SECRET</code> in <code className="font-mono">apps/api/.env</code>.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCardPayment}
                    disabled={loading}
                    className="w-2/3 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting Gateway...
                      </>
                    ) : (
                      <>
                        Proceed to Card Checkout
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: PAYMENT SUCCESSFUL ────────────────────── */}
        {step === "success" && verifiedData && (
          <div className="text-center py-2 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Payment Successful
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Your subscription has been verified and activated in the database.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-left text-xs space-y-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Plan Name:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{verifiedData.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Amount Paid:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {verifiedData.amount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Payment Gateway:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{verifiedData.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Transaction Reference:</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {verifiedData.reference}
                </span>
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 dark:border-emerald-900/40 pt-2">
                <span className="text-zinc-500 dark:text-zinc-400">Subscription Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {verifiedData.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
            >
              Return to Application
            </button>
          </div>
        )}

        {/* ── STEP 3: PAYMENT FAILED / CANCELLED ────────────── */}
        {step === "failed" && (
          <div className="text-center py-2 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 shadow-md">
              <XCircle className="h-8 w-8" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Payment Failed / Payment Cancelled
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {errorMessage || "The transaction could not be verified or was cancelled."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 rounded-xl border border-zinc-200 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setErrorMessage("");
                }}
                className="w-1/2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
