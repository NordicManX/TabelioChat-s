require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');

const app = express();
app.use(express.json());

const PORT = 3000;

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso! 🚀');
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err);
    });

// Rota GET para a raiz do projeto (mensagem de boas-vindas)
app.get('/', (req, res) => {
    res.send('API do TabelioChat está no ar!');
});

// Rota POST para CRIAR um novo usuário
app.post('/users', async (req, res) => {
    try {
        const { nomeCompleto, setor, telefone, foto, email } = req.body;

        // Validação (pode ser melhorada, mas por agora está ok)
        if (!nomeCompleto || !setor || !telefone || !email) {
            return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
        }

        // Verifica se o usuário já existe pelo email
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({ error: 'Este email já está em uso.' }); // 409 Conflict
        }

        // Cria uma nova instância do modelo User
        const newUser = new User({
            nomeCompleto,
            setor,
            telefone,
            foto,
            email
        });

        // Salva o novo usuário no banco de dados
        const savedUser = await newUser.save();

        res.status(201).json({ message: 'Usuário criado com sucesso!', user: savedUser });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}.`);
});