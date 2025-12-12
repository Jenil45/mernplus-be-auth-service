import fs from "fs";
import path from "path";
import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config";
import { RefreshToken } from "../entities/RefreshToken";
import { User } from "../entities/User";
import { Repository } from "typeorm";

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: Buffer;
        try {
            privateKey = fs.readFileSync(
                path.join(__dirname, "../../certs/private.pem"),
            );
        } catch (error) {
            const err = createHttpError(500, "Error while reading private key");
            throw err;
        }

        const accessToken = sign(payload, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: "auth-service",
        });

        return accessToken;
    }

    generateRefresehToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: "HS256",
            expiresIn: "1yr",
            issuer: "auth-service",
            jwtid: String(payload.id),
        });

        return refreshToken;
    }

    async persistRefreshToken(user: User) {
        const MS_IN_YR = 1000 * 60 * 60 * 24 * 365; // 1 yr
        const newRefreshToken = await this.refreshTokenRepository.save({
            expiresAt: new Date(Date.now() + MS_IN_YR),
            user,
        });

        return newRefreshToken;
    }
}
