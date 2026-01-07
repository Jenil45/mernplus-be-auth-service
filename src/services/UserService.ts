import { Brackets, Repository } from "typeorm";
import { User } from "../entities/User";
import { LimitedUserData, UserData, UserQueryParams } from "../types";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";

export class UserService {
    constructor(private readonly userRepository: Repository<User>) {}

    async create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    }: UserData) {
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            const err = createHttpError(400, "Email is already exist");
            throw err;
        }

        // hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                tenant: tenantId ? { id: tenantId } : undefined,
            });
        } catch (error) {
            const err = createHttpError(
                500,
                "Failed to store data in the database",
            );
            throw err;
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: { email },
            select: [
                "id",
                "firstName",
                "lastName",
                "email",
                "role",
                "password",
            ],
        });
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
            relations: {
                tenant: true,
            },
        });
    }

    async update(
        userId: number,
        { firstName, lastName, role, email, tenantId }: LimitedUserData,
    ) {
        const user = await this.findById(userId);
        if (!user) {
            const error = createHttpError(404, "User does not exist");
            throw error;
        }

        if (user?.email !== email) {
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                const error = createHttpError(400, "Email is already exist");
                throw error;
            }
        }

        try {
            return await this.userRepository.update(userId, {
                firstName,
                lastName,
                email,
                role,
                tenant: tenantId ? { id: tenantId } : null,
            });
        } catch (error) {
            const err = createHttpError(
                500,
                "Failed to update user in the database",
            );
            throw err;
        }
    }

    async getAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.userRepository.createQueryBuilder("user");

        if (validatedQuery.q) {
            const serachTerm = `%${validatedQuery.q}%`;
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where(
                        "CONCAT(user.firstName, ' ', user.lastName) ILike :q",
                        { q: serachTerm },
                    ).orWhere("user.email ILike :q", { q: serachTerm });
                }),
            );
        }

        if (validatedQuery.role) {
            queryBuilder.andWhere("user.role = :role", {
                role: validatedQuery.role,
            });
        }

        const result = await queryBuilder
            .leftJoinAndSelect("user.tenant", "tenant")
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .orderBy("user.id", "DESC")
            .getManyAndCount();

        return result;
    }

    async deleteById(userId: number) {
        return await this.userRepository.delete(userId);
    }
}
