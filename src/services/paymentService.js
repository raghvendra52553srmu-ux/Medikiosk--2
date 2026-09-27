import { api } from "@/services/apiClient";

export const createCardOrder = (payload) =>
  api.post("/payments/card/create-order", payload);

export const verifyCardPayment = (payload) =>
  api.post("/payments/card/verify", payload);

export const verifyUpiPayment = (payload) =>
  api.post("/payments/upi/verify", payload);

export const getSubscriptionStatus = () =>
  api.get("/payments/status");

export const cancelPayment = (payload) =>
  api.post("/payments/cancel", payload);
