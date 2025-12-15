import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { ROLES } from "../../src/constants";
import createJWKSMock from "mock-jwks";

describe("POST /auth/self", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();
        // Database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 200 status code for 200 status code", async () => {
            // Act
            const accessToken = jwks.token({ sub: "1", role: ROLES.CUSTOMER });

            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return the user data", async () => {
            // Register user
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };
            const userRepo = connection.getRepository(User);
            const data = await userRepo.save({
                ...userData,
                role: ROLES.CUSTOMER,
            });

            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Add token to cookie

            // Act - Send token as well
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();

            // Assert

            // check if user id matches with registered user
            expect((response.body as Record<string, string>).id).toBe(data.id);
        });

        it("should not return the password field in user data", async () => {
            // Register user
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };
            const userRepo = connection.getRepository(User);
            const data = await userRepo.save({
                ...userData,
                role: ROLES.CUSTOMER,
            });

            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Add token to cookie

            // Act - Send token as well
            const response = await request(app)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();

            // Assert

            // check if user id matches with registered user
            expect(response.body as Record<string, string>).not.toHaveProperty(
                "password",
            );
        });

        it("should return 401 status code if token does not exist", async () => {
            // Register user
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };
            const userRepo = connection.getRepository(User);
            const data = await userRepo.save({
                ...userData,
                role: ROLES.CUSTOMER,
            });

            // Act - Send token as well
            const response = await request(app).get("/auth/self").send();

            // Assert

            // check if user id matches with registered user
            expect(response.statusCode).toBe(401);
        });
    });
});
