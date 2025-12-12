import { Repository } from "typeorm";
import { User } from "../entities/User";
import { UserData } from "../types";
import createHttpError from "http-errors";
import { ROLES } from "../constants";
import bcrypt from "bcrypt";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
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
                role: ROLES.CUSTOMER,
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
        });
    }
}
