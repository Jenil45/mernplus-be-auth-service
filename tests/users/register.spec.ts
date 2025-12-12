// AAA: Arrange (data), Act (trugger), Assert (check expected output)
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entities/User";
import { RefreshToken } from "../../src/entities/RefreshToken";
import { ROLES } from "../../src/constants";
import { isJwt } from "../../src/utils";

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

        it("Should store the hashed password in the database", async () => {
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
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);

            // expect(users[0].role).toBe(ROLES.CUSTOMER);
        });

        it("Should return 400 status code if email is already exists", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohi45@gmail.com",
                password: "Rb!-4593",
            };

            // insert dummy user
            const userRepository = connection.getRepository(User);

            await userRepository.save({ ...userData, role: "customer" });

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });

        it("Should return the access token and refresh token inside a cookie", async () => {
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

        it("Should store the refresh token in the database", async () => {
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
            const refreshTokenRepository =
                connection.getRepository(RefreshToken);

            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: response.body.id,
                })
                .getMany();
            expect(tokens).toHaveLength(1);
        });
    });

    describe("Fields are missing", () => {
        it("Should return 400 status code if email field is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("Should return 400 status code if firstName field is missing", async () => {
            // Arrange
            const userData = {
                firstName: "",
                lastName: "Thakor",
                email: "jenil.rohit45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("Should return 400 status code if lastName field is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "",
                email: "jenil.rohit45@gmail.com",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("Should return 400 status code if password field is missing", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: "jenil.rohit45@gmail.com",
                password: "",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });

    describe("Fields are not in proper format", () => {
        it("Should trim the email field", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: " jenil.rohit45@gmail.com ",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0].email).toBe("jenil.rohit45@gmail.com");
        });

        it("Should return 400 status code if email is not a valid email", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: " jenil.rohit45 ",
                password: "Rb!-4593",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });

        it("Should return 400 status code if password length is less than 8 characters", async () => {
            // Arrange
            const userData = {
                firstName: "Jenil",
                lastName: "Thakor",
                email: " jenil.rohit45@gmail.com",
                password: "789456",
            };

            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(0);
        });
    });
});
