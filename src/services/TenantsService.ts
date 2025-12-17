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

    async update(id: number, tenantData: ITenant) {
        return await this.tenantRepository.update(id, tenantData);
    }

    async getAll() {
        return await this.tenantRepository.find();
    }

    async getById(tenantId: number) {
        return await this.tenantRepository.findOne({ where: { id: tenantId } });
    }

    async deleteById(tenantId: number) {
        return await this.tenantRepository.delete(tenantId);
    }
}
