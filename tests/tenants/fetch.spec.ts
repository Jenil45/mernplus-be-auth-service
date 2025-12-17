// import request from "supertest";
// import { DataSource, Repository } from "typeorm";
// import { AppDataSource } from "../../src/config/data-source";
// import app from "../../src/app";
// import { Tenant } from "../../src/entities/Tenant";
// import createJWKSMock from "mock-jwks";
// import { ROLES } from "../../src/constants";
// import { ITenant } from "../../src/types";

// describe("GET /tenants/", () => {
//     let connection: DataSource;
//     let jwks: ReturnType<typeof createJWKSMock>;
//     let adminToken: string;
//     let tenantRepo: Repository<Tenant>;
//     let tenantData: ITenant;
//     let savedTenant: Tenant;

//     beforeAll(async () => {
//         jwks = createJWKSMock("http://localhost:5501");
//         connection = await AppDataSource.initialize();
//     });

//     beforeEach(async () => {
//         jwks.start();
//         // Database truncate
//         await connection.dropDatabase();
//         await connection.synchronize();

//         adminToken = jwks.token({
//             sub: "1",
//             role: ROLES.ADMIN,
//         });

//         tenantData = [
//         {
//             name: "Tenant name 1",
//             address: "Tenant address 1",
//         },
//         {
//             name: "Tenant name 2",
//             address: "Tenant address 2",
//         },
//         {
//             name: "Tenant name 3",
//             address: "Tenant address 3",
//         },

//         ];

//         tenantRepo = connection.getRepository(Tenant);
//         savedTenant = await tenantRepo.save(tenantData);

//     });

//     afterEach(() => {
//         jwks.stop();
//     });

//     afterAll(async () => {
//         await connection.destroy();
//     });

//     describe("/ - Fetch all data", () => {
//         it("should return 200 status code for fetch all tenant data", async () => {
//             // Arrange
//             const updatedTenantData = {
//                 name: "Updated Tenant name",
//                 address: "Updated Tenant address",
//             }

//             // Act
//             const response = await request(app)
//                 .patch(`/tenants/${savedTenant.id}`)
//                 .set("Cookie", [`accessToken=${adminToken};`])
//                 .send(updatedTenantData);

//             // Assert
//             expect(response.statusCode).toBe(200);
//         });

//         it("should update a tenant in database", async () => {
//             // Arrange
//             const updatedTenantData = {
//                 name: "Updated Tenant name",
//                 address: "Updated Tenant address",
//             }

//             // Act
//             await request(app)
//                 .patch(`/tenants/${savedTenant.id}`)
//                 .set("Cookie", [`accessToken=${adminToken};`])
//                 .send(updatedTenantData);

//             // Assert
//             const tenantRepo = connection.getRepository(Tenant);
//             const tenants = await tenantRepo.find({});
//             expect(tenants).toHaveLength(1);
//             expect(tenants[0].name).toBe(updatedTenantData.name);
//             expect(tenants[0].address).toBe(updatedTenantData.address);
//         });

//         it("should return 401 if user is not authenticated", async () => {
//             // Arrange
//             const updatedTenantData = {
//                 name: "Updated Tenant name",
//                 address: "Updated Tenant address",
//             }

//             // Act
//             const response = await request(app)
//                 .patch(`/tenants/${savedTenant.id}`)
//                 .send(updatedTenantData);

//             // Assert
//             expect(response.statusCode).toBe(401);
//         });

//         it("should return 403 if user is not an admin", async () => {
//             // Arrange
//             const updatedTenantData = {
//                 name: "Updated Tenant name",
//                 address: "Updated Tenant address",
//             }

//             adminToken = jwks.token({
//                 sub: "1",
//                 role: ROLES.MANAGER,
//             });

//             // Act
//             const response = await request(app)
//                 .patch(`/tenants/${savedTenant.id}`)
//                 .set("Cookie", [`accessToken=${adminToken};`])
//                 .send(updatedTenantData);

//             // Assert
//             expect(response.statusCode).toBe(403);
//         });
//     });

// });
