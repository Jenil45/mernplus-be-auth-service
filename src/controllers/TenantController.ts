import { Response, NextFunction } from "express";
import { CreateTenantRequest } from "../types";
import { validationResult } from "express-validator";
import { Logger } from "winston";
import { TenantService } from "../services/TenantsService";

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { name, address } = req.body;
        this.logger.debug("Requesting for creating tenant", req.body);

        try {
            // saving tenant
            const tenant = await this.tenantService.create({ name, address });
            this.logger.info("Tenant created successfully", { id: tenant.id });
            res.status(201).json({ id: tenant.id });
        } catch (error) {
            next(error);
        }
    }
}
