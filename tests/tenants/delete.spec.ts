import request from "supertest";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { Tenant } from "../../src/entities/Tenant";
import createJWKSMock from "mock-jwks";
import { ROLES } from "../../src/constants";
import { ITenant } from "../../src/types";

describe("DELETE /tenants/:id", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    let adminToken: string;
    let tenantRepo: Repository<Tenant>;
    let tenantData: ITenant;
    let savedTenant: Tenant;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();

        adminToken = jwks.token({
            sub: "1",
            role: ROLES.ADMIN,
        });

        tenantData = {
            name: "Tenant name",
            address: "Tenant address",
        };

        tenantRepo = connection.getRepository(Tenant);
        savedTenant = await tenantRepo.save(tenantData);
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 200 status code for tenant delete with success", async () => {
            // Act
            const response = await request(app)
                .delete(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`]);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should delete a tenant in database", async () => {
            // Act
            await request(app)
                .delete(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`]);

            // Assert
            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find({});
            expect(tenants).toHaveLength(0);
        });

        it("should return 401 if user is not authenticated", async () => {
            // Act
            const response = await request(app).delete(
                `/tenants/${savedTenant.id}`,
            );

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 403 if user is not an admin", async () => {
            adminToken = jwks.token({
                sub: "1",
                role: ROLES.MANAGER,
            });

            // Act
            const response = await request(app)
                .delete(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`]);

            // Assert
            expect(response.statusCode).toBe(403);
        });
    });

    describe("Fields are missing", () => {
        it("should return 404 if id has not been sent as param", async () => {
            // Act
            const response = await request(app)
                .delete(`/tenants/`)
                .set("Cookie", [`accessToken=${adminToken};`]);

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it("should return 400 if id has not been sent in correct format", async () => {
            // Arrange
            adminToken = jwks.token({
                sub: "1",
                role: ROLES.ADMIN,
            });

            // Act
            const response = await request(app)
                .delete(`/tenants/xyz`)
                .set("Cookie", [`accessToken=${adminToken};`]);

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
