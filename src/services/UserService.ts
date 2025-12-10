import { Repository } from "typeorm";
import { User } from "../entities/User";
import { UserData } from "../types";
import createHttpError from "http-errors";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
            });
        } catch (error) {
            const err = createHttpError(
                500,
                "Failed to store data in the database",
            );
            throw err;
        }
    }
}
