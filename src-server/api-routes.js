import express from 'express';
import { loginUser } from './jwt-middleware.js';
import coursesRoutes from './courses-routes.js';

export const apiRoutes = express.Router();

export default apiRoutes;


apiRoutes.use('/courses', coursesRoutes);

apiRoutes.post('/login', loginUser);

apiRoutes.get('/*', (req, res) => {
    res.status(404).send('API not founded');
});


