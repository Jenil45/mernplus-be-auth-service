import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        isEmail: {
            errorMessage: "Email should be valid email",
        },
    },
});
