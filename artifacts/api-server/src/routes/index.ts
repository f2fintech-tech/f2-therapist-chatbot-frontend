import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(userRouter);

export default router;
