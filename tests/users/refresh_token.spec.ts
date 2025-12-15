import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { ROLES } from "../../src/constants";
import createJWKSMock from "mock-jwks";
import { RefreshToken } from "../../src/entities/RefreshToken";
import { JwtPayload, sign } from "jsonwebtoken";
import { Config } from "../../src/config";
import { isJwt } from "../../src/utils";

describe("POST /auth/refresh", () => {
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
        it("should return new access token when refresh token is valid", async () => {
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
                data,
            });

            const payload: JwtPayload = {
                sub: String(data.id),
                role: data.role,
                id: newRefreshToken.id,
            };

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: "HS256",
                expiresIn: "1yr",
                issuer: "auth-service",
                jwtid: String(payload.id),
            });

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send();

            // Assert
            interface Headers {
                ["set-cookie"]?: string[];
            }

            let resAccessToken: string | null = null;
            const cookies = (response.headers as Headers)["set-cookie"] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    resAccessToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(resAccessToken).not.toBeNull();

            expect(isJwt(resAccessToken)).toBeTruthy();
            expect(response.statusCode).toBe(200);
        });
        it("should rotate refresh token on refresh", async () => {
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
                data,
            });

            const payload: JwtPayload = {
                sub: String(data.id),
                role: data.role,
                id: newRefreshToken.id,
            };

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: "HS256",
                expiresIn: "1yr",
                issuer: "auth-service",
                jwtid: String(payload.id),
            });

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send();

            // Assert
            interface Headers {
                ["set-cookie"]?: string[];
            }

            let resRefreshToken: string | null = null;
            const cookies = (response.headers as Headers)["set-cookie"] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith("refreshToken=")) {
                    resRefreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(resRefreshToken).not.toBeNull();
            expect(isJwt(resRefreshToken)).toBeTruthy();
            expect(response.statusCode).toBe(200);
        });

        it("should return 401 if refresh token is missing", async () => {
            // Act
            const response = await request(app).post("/auth/refresh").send();

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if refresh token is expired", async () => {
            // Arrange
            const payload: JwtPayload = {
                sub: String(1),
                role: ROLES.CUSTOMER,
                id: 1,
            };

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: "HS256",
                expiresIn: "-1s",
                issuer: "auth-service",
                jwtid: String(payload.id),
            });

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 401 if refresh token is tampered", async () => {
            // Arrange
            const payload: JwtPayload = {
                sub: String(1),
                role: ROLES.CUSTOMER,
                id: 1,
            };

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: "HS256",
                expiresIn: "1yr",
                issuer: "auth-service",
                jwtid: String(payload.id),
            });

            const tampered = refreshToken.slice(0, -3) + "abc";

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${tampered};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(401);
        });

        it("should return 400 if user does not exist", async () => {
            // Arrange
            const payload: JwtPayload = {
                sub: String(1),
                role: ROLES.CUSTOMER,
                id: 2,
            };

            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: "HS256",
                expiresIn: "1yr",
                issuer: "auth-service",
                jwtid: String(payload.id),
            });

            // Act
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken};`])
                .send();

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
