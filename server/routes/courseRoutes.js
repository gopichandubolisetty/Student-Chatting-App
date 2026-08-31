const express = require('express');
const router = express.router();
const {protect,authorize} = require('../middlewares/authMiddleware');
const {createCourse} = require('../controllers/courseController');

router.post('/',protect,authorize('admin'),createCourse);

module.exports  = router;