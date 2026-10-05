const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/checkout', verifyToken, issueController.issueBook);
router.post('/return', verifyToken, authorizeRoles('admin', 'librarian'), issueController.returnBook);
router.get('/my-books', verifyToken, issueController.getMyHistory);
router.get('/all', verifyToken, authorizeRoles('admin', 'librarian'), issueController.getAll);
router.get('/active', verifyToken, authorizeRoles('admin', 'librarian'), issueController.getActiveIssues);
router.get('/active-by-student', verifyToken, authorizeRoles('admin', 'librarian'), issueController.getActiveIssuesByStudent);
router.post('/issue', verifyToken, authorizeRoles('admin', 'librarian'), issueController.issueBook);

module.exports = router;