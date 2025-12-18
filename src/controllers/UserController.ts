import { Request, Response, NextFunction } from "express";
import { CreateUserRequest, UpdateUserRequest } from "../types";
import { validationResult } from "express-validator";
import { Logger } from "winston";
import createHttpError from "http-errors";
import { UserService } from "../services/UserService";

export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly logger: Logger,
    ) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, password, tenantId, role } =
            req.body;

        this.logger.debug("Requesting for creating user", req.body);

        try {
            // saving user
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                tenantId,
                role,
                password,
            });
            this.logger.info("User created successfully", { id: user.id });
            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
        }
    }

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { firstName, lastName, email, role, tenantId } = req.body;

        const userId = req.params.id;
        if (Number.isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }
        this.logger.debug("Requesting for updating user", { id: userId });

        try {
            // updating user
            await this.userService.update(Number(userId), {
                firstName,
                lastName,
                email,
                role,
                tenantId,
            });
            this.logger.info("User updated successfully", { id: userId });
            res.status(200).json({ id: Number(userId) });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.getAll();
            this.logger.info("All users have been fetched");
            res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        if (Number.isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }

        try {
            const user = await this.userService.findById(Number(userId));

            if (!user) {
                next(createHttpError(404, "User does not exist."));
                return;
            }

            this.logger.info("User has been fetched");

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        if (Number.isNaN(Number(userId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }

        this.logger.debug("Requesting for deleting user", {
            id: Number(userId),
        });

        try {
            await this.userService.deleteById(Number(userId));
            this.logger.info("User deleted successfully", {
                id: Number(userId),
            });
            res.status(200).json({ id: Number(userId) });
        } catch (error) {
            next(error);
        }
    }
}
