const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Public or Student accessible routes
router.get('/', bookController.getAll);
router.get('/:id', bookController.getById);

// Admin and Librarian restricted routes
router.post('/', verifyToken, authorizeRoles('admin', 'librarian'), bookController.create);
router.put('/:id', verifyToken, authorizeRoles('admin', 'librarian'), bookController.update);
router.delete('/:id', verifyToken, authorizeRoles('admin'), bookController.delete);

module.exports = router;