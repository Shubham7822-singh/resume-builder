import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { connect } from 'mongoose';
import { connectDB } from './config/db.js';
import userRoutes from './routes/userRoutes.js';

import path from 'path'
import { fileURLToPath } from 'url';
import resumeRoutes from './routes/resumeRoutes.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
const app = express();
const PORT = 4000;

app.use(cors())

connectDB();

app.use(express.json())

app.use('/api/auth', userRoutes)
app.use('/api/resume', resumeRoutes)

app.use(
    '/uploads',
    express.static(path.join(__dirname,'uploads'),{
        setHeaders: (res, __path) => {
            res.set('Access-Control-Allow-Origin', 'http://localhost:4000');
        },
    })
);

app.get('/', (req,res) => {
    res.send('API WORKING')
})

app.listen(PORT, () => {
    console.log(`Server Started on http://localhost:${PORT}`)
})