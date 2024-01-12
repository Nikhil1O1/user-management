const {Router} = require("express");
const { signup, login, getUserInfo } = require("../controllers/userController");
const { forgotPassword, resetPassword } = require("../controllers/authController");
const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.get('/:id', getUserInfo);
module.exports = router;