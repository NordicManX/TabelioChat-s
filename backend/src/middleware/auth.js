const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('[AUTH 🔴] Token não fornecido.');
        return res.status(401).json({ codigo: 401, mensagem: 'Token não fornecido.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        console.log('[AUTH 🟡] Token com erro de formato.');
        return res.status(401).json({ codigo: 401, mensagem: 'Erro no formato do token.' });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
        console.log('[AUTH 🟡] Token mal formatado (sem "Bearer").');
        return res.status(401).json({ codigo: 401, mensagem: 'Token mal formatado.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('[AUTH 🔴] Token inválido ou expirado.');
            return res.status(401).json({ codigo: 401, mensagem: 'Token inválido ou expirado.' });
        }

        console.log(`[AUTH 🟢] Token validado para o usuário ID: ${decoded.userId}`);
        req.userId = decoded.userId;
        return next();
    });
}

module.exports = authMiddleware;