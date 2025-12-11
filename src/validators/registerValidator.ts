import { checkSchema } from "express-validator";

export default checkSchema({
    email: {
        errorMessage: "Email is required",
        notEmpty: true,
        trim: true,
        isEmail: {
            errorMessage: "Email should be valid email",
        },
    },

    firstName: {
        errorMessage: "First Name is required",
        notEmpty: true,
        trim: true,
    },

    lastName: {
        errorMessage: "Last Name is required",
        notEmpty: true,
        trim: true,
    },

    password: {
        errorMessage: "Password is required",
        notEmpty: true,
        trim: true,
        isLength: {
            errorMessage: "Password length should be at least 8 characters!",
            options: {
                min: 8,
            },
        },
    },
});
