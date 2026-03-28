import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adsRouter from "./ads";
import productsRouter from "./products";
import authRouter from "./auth";
import aiRouter from "./ai";
import adminRouter from "./admin";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adsRouter);
router.use(productsRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(adminRouter);
router.use(paymentsRouter);

export default router;
