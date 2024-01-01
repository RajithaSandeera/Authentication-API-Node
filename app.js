import express from 'express';
import dbConnection from './dbConnection.js';
import routes from './routes.js';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 9000;

const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
// Middleware to parse JSON requests
app.use(express.json());
// app.use(cors());
app.use(cors(corsOptions));


app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api', routes);
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || 'Internal Server Error';
    res.status(err.statusCode).json({
        message: err.message,
    });
});

// If database is connected successfully, then run the server
dbConnection
    .getConnection()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(`Failed to connect to the database: ${err.message}`);
    });
