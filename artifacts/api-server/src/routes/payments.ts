import { Router, type IRouter } from "express";
import { query } from "../lib/db";

const router: IRouter = Router();

router.post("/payments/initiate", async (req, res) => {
  const { requestId, type = "standard" } = req.body;
  const isPremium = type === "premium";
  const amount = isPremium ? 25 : 10;
  try {
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (requestId) {
      await query(
        "UPDATE advert_requests SET payment_status = 'pending', type = $1 WHERE id = $2",
        [type, requestId]
      );
    }
    res.json({
      paymentRef,
      amount,
      currency: "USD",
      status: "pending",
      message: isPremium
        ? "Premium advert request initiated. Complete payment to prioritise your ad."
        : "Standard advert request payment initiated.",
      instructions: "Use EcoCash, OneMoney, or bank transfer to reference: " + paymentRef,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/payments/confirm", async (req, res) => {
  const { paymentRef, requestId } = req.body;
  if (!paymentRef || !requestId) { res.status(400).json({ error: "paymentRef and requestId required" }); return; }
  try {
    const result = await query(
      "UPDATE advert_requests SET payment_status = 'paid', status = 'priority' WHERE id = $1 RETURNING *",
      [requestId]
    );
    res.json({ success: true, request: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
