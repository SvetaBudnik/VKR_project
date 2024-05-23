import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;

const secret = "secretPhrase";

let JWT_DEBUG = false;

export function enableJwtDebugMode() {
    JWT_DEBUG = true;
}

/**
 * @type {Array<{username: string, password: string, role: "admin" | "user"}>}
 */
export const users = [
    {
        username: 'admin',
        password: 'admin',
        role: 'admin',
    },
    {
        username: 'user',
        password: 'user',
        role: 'user',
    },
    {
        username: 'suetlana',
        password: '12345',
        role: 'user',
    },
];

/**
 * Middleware, проверяющий, делает ли этот запрос залогиненный пользователь или нет
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
export const authenticateJWT = (req, res, next) => {
    if (JWT_DEBUG) {
        console.log("[INFO]: Auth middleware in debug mode. All users are authenticated");
        console.log("[INFO]: To disable debug mode, remove enableJwtDebugMode() call");
        req.user = {user: "user", role: "user"};
        return next();
    }

    /** @type {string} */
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Потому что заголовок выглядит как `Bearer <token>`
        verify(token, secret, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
}

/**
 * Middleware, выполняющий проверку, делает ли этот запрос админ или нет
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */
export const requireAdmin = (req, res, next) => {
    if (JWT_DEBUG) {
        console.log("[INFO]: Auth middleware in debug mode. All users are authenticated as admins");
        console.log("[INFO]: To disable debug mode, remove enableJwtDebugMode() call");
        req.user = {user: "user", role: "admin"};
        return next();
    }

    /**
     * @type {null | {username: string, role: "user" | "admin"}}
     */
    const user = req.user;
    if (user === null || user.role === "user") {
        return res.sendStatus(401).send("Admin role required");
    }

    next();
}

export const loginUser = (req, res) => {
    /** @type {{username: string, password: string}} */
    const { username, password } = req.body;

    const user = users.find(
        (u) => u.username === username && u.password === password,
    );
    if (!user) {
        res.status(401).send("Username or password is incorrect");
        return;
    }

    const token = sign({ username: user.username, role: user.role }, secret);
    res.json({ token, role: user.role });
}
