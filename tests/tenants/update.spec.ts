import request from "supertest";
import { DataSource, Repository } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { Tenant } from "../../src/entities/Tenant";
import createJWKSMock from "mock-jwks";
import { ROLES } from "../../src/constants";
import { ITenant } from "../../src/types";

describe("PATCH /tenants/:id", () => {
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
            name: "Tenant name 2",
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
        it("should return 200 status code for tenant update with success", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            // Act
            const response = await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should update a tenant in database", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            // Act
            await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find({});
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(updatedTenantData.name);
            expect(tenants[0].address).toBe(updatedTenantData.address);
        });

        it("should return 401 if user is not authenticated", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            // Act
            const response = await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 403 if user is not an admin", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            adminToken = jwks.token({
                sub: "1",
                role: ROLES.MANAGER,
            });

            // Act
            const response = await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(403);
        });
    });

    describe("Fields are missing", () => {
        it("should return 400 status code if name field is missing", async () => {
            // Arrange
            const updatedTenantData = {
                name: "",
                address: "Updated Tenant address",
            };

            // Act
            const response = await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 400 status code if address field is missing", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "",
            };

            // Act
            const response = await request(app)
                .patch(`/tenants/${savedTenant.id}`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(400);
        });

        it("should return 404 if id has not been sent as param", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            // Act
            const response = await request(app)
                .patch(`/tenants/`)
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(404);
        });

        it("should return 400 if id has not been sent in correct format", async () => {
            // Arrange
            const updatedTenantData = {
                name: "Updated Tenant name",
                address: "Updated Tenant address",
            };

            adminToken = jwks.token({
                sub: "1",
                role: ROLES.ADMIN,
            });

            // Act
            const response = await request(app)
                .patch(`/tenants/xyz`)
                .set("Cookie", [`accessToken=${adminToken};`])
                .send(updatedTenantData);

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
