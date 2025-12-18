import request from "supertest";
import bcrypt from "bcryptjs";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import app from "../../src/app";
import { isJwt } from "../../src/utils";
import { ROLES } from "../../src/constants";

describe("POST /auth/login", () => {
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
        it("should return 200 status code for successful login", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
            });

            // Act
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });

            // Assert
            expect(response.statusCode).toBe(200);
        });
        it("should return the access token and refresh token inside a cookie", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
            });

            // Act
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password });

            interface Headers {
                ["set-cookie"]?: string[];
            }

            // Assert
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            const cookies = (response.headers as Headers)["set-cookie"] || [];

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });

            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();

            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });

        it("should return the 400 if email or password is wrong", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                password: hashedPassword,
                role: ROLES.CUSTOMER,
            });

            // Act
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: "Wrong password" });

            // Assert
            expect(response.statusCode).toBe(400);
        });
    });
});
