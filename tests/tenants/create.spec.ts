import request from "supertest";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { Tenant } from "../../src/entities/Tenant";

describe("POST /tenants", () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 201 status code for successful tenant creation", async () => {
            // Arrange
            const tenantData = {
                name: "Tenant name",
                address: "Tenant address",
            };

            // Act
            const response = await request(app)
                .post("/tenants")
                .send(tenantData);

            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("should create a tenant in database", async () => {
            // Arrange
            const tenantData = {
                name: "Tenant name",
                address: "Tenant address",
            };

            // Act
            await request(app).post("/tenants").send(tenantData);

            // Assert
            const tenantRepo = connection.getRepository(Tenant);
            const tenants = await tenantRepo.find({});
            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenantData.name);
            expect(tenants[0].address).toBe(tenantData.address);
        });
    });
});
