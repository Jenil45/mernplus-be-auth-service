import { Repository } from "typeorm";
import { ITenant } from "../types";
import { Tenant } from "../entities/Tenant";

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create({ name, address }: ITenant) {
        return await this.tenantRepository.save({
            name,
            address,
        });
    }
}
