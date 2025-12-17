import express, { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import authenticate from "../middlewares/authenticate";
import { canAccess } from "../middlewares/canAccess";
import { ROLES } from "../constants";
import createUserValidator from "../validators/create-user-validator";
import { UserController } from "../controllers/UserController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import updateUserValidator from "../validators/update-user-validator";

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userController = new UserController(userService, logger);

router.post(
    "/",
    authenticate,
    canAccess([ROLES.ADMIN]),
    createUserValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.create(req, res, next),
);

router.patch(
    "/:id",
    authenticate,
    canAccess([ROLES.ADMIN]),
    updateUserValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.update(req, res, next),
);

router.get(
    "/",
    authenticate,
    canAccess([ROLES.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAll(req, res, next),
);

router.get(
    "/:id",
    authenticate,
    canAccess([ROLES.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getOne(req, res, next),
);

router.delete(
    "/:id",
    authenticate,
    canAccess([ROLES.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.destroy(req, res, next),
);

export default router;
