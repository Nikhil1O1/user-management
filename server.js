const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const dotenv = require('dotenv')

dotenv.config({ path: `${__dirname}/config.env` });
const app = express()
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
mongoose
    .connect(process.env.MONGO_DB)
    .then(()=> console.log(`connected to db`))
    .catch((err)=> console.log(err))

app.use(userRoutes);

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`)
});