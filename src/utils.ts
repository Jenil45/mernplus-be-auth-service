export const calculateDiscount = (price: number, percentage: number) => {
    return price * (percentage / 100);
};

export const isJwt = (token: string | null): boolean => {
    if (token === null) {
        return false;
    }

    const parts = token.split(".");

    // JWT should have total 3 parts
    if (parts.length !== 3) {
        return false;
    }

    // Every part should be base64 url -> here if it successfully converted then succeedd otherwise fail
    try {
        parts.forEach((part) => {
            Buffer.from(part, "base64").toString("utf-8");
        });

        return true;
    } catch (error) {
        return false;
    }
};
