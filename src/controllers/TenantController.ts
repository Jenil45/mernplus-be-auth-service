import { Response, NextFunction } from "express";
import { CreateTenantRequest } from "../types";
import { validationResult } from "express-validator";
import { Logger } from "winston";
import { TenantService } from "../services/TenantsService";
import createHttpError from "http-errors";

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

    async update(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }

        const { name, address } = req.body;
        const tenantId = req.params.id;
        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }
        this.logger.debug("Requesting for updating tenant", { id: tenantId });

        try {
            // updating tenant
            await this.tenantService.update(Number(tenantId), {
                name,
                address,
            });
            this.logger.info("Tenant updated successfully", { id: tenantId });
            res.status(200).json({ id: Number(tenantId) });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: CreateTenantRequest, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.getAll();
            this.logger.info("All tenant have been fetched");
            res.status(200).json(tenants);
        } catch (error) {
            next(error);
        }
    }

    async getOne(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const tenantId = req.params.id;
        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }

        try {
            // saving tenant
            const tenant = await this.tenantService.getById(Number(tenantId));

            if (!tenant) {
                next(createHttpError(404, "Tenant does not exist."));
                return;
            }

            this.logger.info("Tenant has been fetched");

            res.status(200).json(tenant);
        } catch (error) {
            next(error);
        }
    }

    async destroy(req: CreateTenantRequest, res: Response, next: NextFunction) {
        const tenantId = req.params.id;
        if (isNaN(Number(tenantId))) {
            next(createHttpError(400, "Invalid url param"));
            return;
        }

        this.logger.debug("Requesting for deleting tenant", {
            id: Number(tenantId),
        });

        try {
            // saving tenant
            await this.tenantService.deleteById(Number(tenantId));
            this.logger.info("Tenant deleted successfully", {
                id: Number(tenantId),
            });
            res.status(200).json({ id: Number(tenantId) });
        } catch (error) {
            next(error);
        }
    }
}
