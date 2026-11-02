import { Router } from 'express';
import { listPizzas, getPizza, builderOptions, publicConfig } from '../controllers/catalogController.js';

const router = Router();

router.get('/pizzas', listPizzas);
router.get('/pizzas/:slug', getPizza);
router.get('/builder-options', builderOptions);
router.get('/config', publicConfig);

export default router;
