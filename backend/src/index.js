console.log("--- O ARQUIVO INDEX.JS FOI CARREGADO NESTE EXATO MOMENTO ---");

require('dotenv').config();

// 2. Importa os pacotes e módulos
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');

// 3. Inicializa o aplicativo e os middlewares
const app = express();
app.use(express.json());

const PORT = 3000;

// 4. Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso! 🚀');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// 5. Definição das Rotas

// Rota GET para a raiz do projeto (pública)
app.get('/', (req, res) => {
    res.send('API do TabelioChat está no ar!');
});

// Rota POST para CADASTRO de usuário (pública)
app.post('/users', async (req, res) => {
    try {
        const { nomeCompleto, setor, telefone, foto, email, password } = req.body;

        // --- VALIDAÇÃO 1: Campos Obrigatórios ---
        if (!nomeCompleto || !setor || !telefone || !email || !password) {
            console.log('[SERVIDOR 🔴] Tentativa de cadastro falhou: Campos obrigatórios faltando.');
            return res.status(400).json({
                codigo: 400,
                mensagem: "Todos os campos (nomeCompleto, setor, telefone, email, password) são obrigatórios."
            });
        }

        // --- VALIDAÇÃO 2: Usuário Já Existe ---
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            console.log(`[SERVIDOR 🟡] Tentativa de cadastro falhou: O email '${email}' já está em uso.`);
            return res.status(409).json({
                codigo: 409,
                mensagem: 'Este email já está em uso.'
            });
        }

        // --- Processo de Criação ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nomeCompleto, setor, telefone, foto, email, password: hashedPassword
        });

        const savedUser = await newUser.save();

        const userResponse = { ...savedUser._doc };
        delete userResponse.password;

        // --- SUCESSO ---
        console.log(`[SERVIDOR 🟢] Usuário '${savedUser.email}' criado com sucesso! ID: ${savedUser._id}`);
        res.status(201).json({
            codigo: 201,
            mensagem: 'Usuário criado com sucesso!',
            usuario: userResponse
        });

    } catch (error) {
        // --- ERRO INTERNO ---
        console.error('[SERVIDOR 🆘] Erro inesperado ao criar usuário:', error);
        res.status(500).json({
            codigo: 500,
            mensagem: 'Ocorreu um erro inesperado no servidor.'
        });
    }
});

// Rota POST para LOGIN de usuário (pública)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;


        // --- VALIDAÇÃO 1: Campos Obrigatórios ---
        if (!email || !password) {
            console.log('[SERVIDOR 🔴] Tentativa de login falhou: Email ou senha não fornecidos.');
            return res.status(400).json({ codigo: 400, mensagem: 'Email e senha são obrigatórios.' });
        }

        // --- VALIDAÇÃO 2: Usuário Existe? ---
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log(`[SERVIDOR 🟡] Tentativa de login falhou: Usuário com email '${email}' não encontrado.`);
            return res.status(401).json({ codigo: 401, mensagem: 'Credenciais inválidas.' }); // 401 Unauthorized
        }

        // --- VALIDAÇÃO 3: Senha Correta? ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[SERVIDOR 🟡] Tentativa de login falhou: Senha incorreta para o email '${email}'.`);
            return res.status(401).json({ codigo: 401, mensagem: 'Credenciais inválidas.' });
        }

        // --- SUCESSO ---
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log(`[SERVIDOR 🟢] Login bem-sucedido para o usuário '${email}'. Token gerado.`);
        res.status(200).json({
            codigo: 200,
            mensagem: 'Login bem-sucedido!',
            token: token
        });

    } catch (error) {
        // --- ERRO INTERNO ---
        console.error('[SERVIDOR 🆘] Erro inesperado ao fazer login:', error);
        res.status(500).json({ codigo: 500, mensagem: 'Ocorreu um erro inesperado no servidor.' });
    }
});

// Rota GET para LISTAR TODOS os usuários (ROTA PROTEGIDA)
app.get('/users', authMiddleware, async (req, res) => {
    try {
        // O middleware já logou a validação do token, então aqui só precisamos logar a ação.
        console.log(`[SERVIDOR 🟢] Requisição para listar usuários recebida. Usuário autenticado: ${req.userId}`);

        const users = await User.find().select('-password');

        res.status(200).json(users);

    } catch (error) {
        console.error('[SERVIDOR 🆘] Erro inesperado ao listar usuários:', error);
        res.status(500).json({ codigo: 500, mensagem: 'Ocorreu um erro inesperado no servidor.' });
    }
});

// 6. Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});