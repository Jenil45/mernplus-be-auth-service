import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { ROLES } from "../../src/constants";
import createJWKSMock from "mock-jwks";
import { RefreshToken } from "../../src/entities/RefreshToken";
import { sign } from "jsonwebtoken";
import { Config } from "../../src/config";

describe("POST /auth/logout", () => {
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
        it("should logout user and clear refresh token cookie", async () => {
            // Create a user
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

            // Assert

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Create a refresh token
            const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
            const tokenRepo = connection.getRepository(RefreshToken);
            const newRefreshToken = await tokenRepo.save({
                expiresAt: new Date(Date.now() + MS_IN_YR),
                user: data,
            });

            const refreshToken = sign(
                {
                    sub: String(data.id),
                    role: data.role,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "1yr",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};refreshToken=${refreshToken};`,
                ])
                .send();

            // Assert
            interface Headers {
                ["set-cookie"]?: string[];
            }

            const logoutCookie =
                (response.headers as Headers)["set-cookie"] || [];
            expect(logoutCookie.join(";")).toContain("accessToken=;");
            expect(logoutCookie.join(";")).toContain("refreshToken=;");
        });

        it("should delete refresh token from db", async () => {
            // Create a user
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

            // Assert

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Create a refresh token
            const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
            const tokenRepo = connection.getRepository(RefreshToken);
            const newRefreshToken = await tokenRepo.save({
                expiresAt: new Date(Date.now() + MS_IN_YR),
                user: data,
            });

            const refreshToken = sign(
                {
                    sub: String(data.id),
                    role: data.role,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "1yr",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            // Act
            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};refreshToken=${refreshToken};`,
                ])
                .send();

            const deletedToken = await tokenRepo.findOne({
                where: { id: newRefreshToken.id },
            });

            expect(deletedToken).toBeNull();
        });

        it("should return 200 status code on logged out successfully", async () => {
            // Create a user
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

            // Assert

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Create a refresh token
            const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
            const tokenRepo = connection.getRepository(RefreshToken);
            const newRefreshToken = await tokenRepo.save({
                expiresAt: new Date(Date.now() + MS_IN_YR),
                user: data,
            });

            const refreshToken = sign(
                {
                    sub: String(data.id),
                    role: data.role,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "1yr",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};refreshToken=${refreshToken};`,
                ])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should still clear cookies if refresh token already deleted", async () => {
            // Create a user
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

            // Assert

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Create a refresh token
            const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
            const tokenRepo = connection.getRepository(RefreshToken);
            const newRefreshToken = await tokenRepo.save({
                expiresAt: new Date(Date.now() + MS_IN_YR),
                user: data,
            });

            const refreshToken = sign(
                {
                    sub: String(data.id),
                    role: data.role,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "1yr",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            await tokenRepo.delete({ id: newRefreshToken.id });

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken};refreshToken=${refreshToken};`,
                ])
                .send();

            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should fail if access token is missing", async () => {
            // Create a user
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

            // Create a refresh token
            const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
            const tokenRepo = connection.getRepository(RefreshToken);
            const newRefreshToken = await tokenRepo.save({
                expiresAt: new Date(Date.now() + MS_IN_YR),
                user: data,
            });

            const refreshToken = sign(
                {
                    sub: String(data.id),
                    role: data.role,
                    id: newRefreshToken.id,
                },
                Config.REFRESH_TOKEN_SECRET!,
                {
                    algorithm: "HS256",
                    expiresIn: "1yr",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should fail if refresh token is missing", async () => {
            // Create a user
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

            // Assert

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });

            // Act
            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(401);
        });
    });
});
