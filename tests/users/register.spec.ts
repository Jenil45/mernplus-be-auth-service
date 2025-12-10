// AAA: Arrange (data), Act (trugger), Assert (check expected output)
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { truncateTables } from "../utils";
import { User } from "../../src/entities/User";
import { ROLES } from "../../src/constants";

describe("POST /auth/register", () => {
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
        it("Should return the 201 status code", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("Should return valid JSON response", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("Should persist the user in the database", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            await request(app).post("/auth/register").send(userData);

            // Assert
            const userRepository = connection.getRepository(User);

            const users = await userRepository.find();

            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });

        it("Should return id of the created user", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.body).toHaveProperty("id");
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });

        it("Should assign a customer role", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            await request(app).post("/auth/register").send(userData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(ROLES.CUSTOMER);
        });
    });

    describe("Fields are missing", () => {});
});
