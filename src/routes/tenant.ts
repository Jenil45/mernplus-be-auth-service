import express, { Request, Response, NextFunction } from "express";
import { TenantController } from "../controllers/TenantController";
import tenantValidator from "../validators/tenant-validator";
import logger from "../config/logger";
import { TenantService } from "../services/TenantsService";
import { AppDataSource } from "../config/data-source";
import { Tenant } from "../entities/Tenant";

const router = express.Router();

const tenantRepository = AppDataSource.getRepository(Tenant);
// const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService, logger);

router.post(
    "/",
    tenantValidator,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.create(req, res, next),
);

export default router;
