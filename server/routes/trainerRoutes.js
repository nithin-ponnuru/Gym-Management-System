const express = require('express');
const router = express.Router();
const { getTrainers, getTrainer, createTrainer, updateTrainer, deleteTrainer } = require('../controllers/trainerController');

router.route('/').get(getTrainers).post(createTrainer);
router.route('/:id').get(getTrainer).put(updateTrainer).delete(deleteTrainer);

module.exports = router;
