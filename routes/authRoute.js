const express=require('express');
const { createUser, loginUserCtrl, getallUsers,
        getUser, deleteUser, updateUser, blockUser, unblockUser, 
        handleRefreshToken, logout, updatePassword, forgotPasswordToken,
        resetPassword, loginAdminCtrl, getWishList, saveAddress, userCart,
        getUserCart, emptyCart, applyCoupon, createOrder, getOrders, updateOrderStatus } = require('../controller/userCtrl');

const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

const router=express.Router()

router.post('/register',createUser);
router.post('/forgot-password-token',forgotPasswordToken);
router.put('/reset-password/:token',resetPassword);
router.put('/order/update-order/:id', authMiddleware , isAdmin , updateOrderStatus);
router.post('/login', loginUserCtrl);
router.post('/admin-login', loginAdminCtrl);
router.post('/cart', authMiddleware ,  userCart);
router.post('/cart/applycoupon', authMiddleware ,  applyCoupon);
router.post('/cart/cash-order', authMiddleware ,  createOrder);
router.get('/all-users', getallUsers);
router.get('/get-orders',authMiddleware , getOrders);
router.get('/refresh' , handleRefreshToken);
router.put('/password' , authMiddleware , updatePassword);
router.get('/logout' , logout);
router.get('/wishlist', authMiddleware , getWishList); 
router.get('/cart', authMiddleware , getUserCart); 
router.get('/:id', authMiddleware , isAdmin , getUser); // we firstly go tp authmiddleware then isAdmin and after successfull verification we go to getuser via next() for middleware
router.delete('/empty-cart', authMiddleware ,emptyCart);
router.delete('/:id', deleteUser);
router.put('/edit-user', authMiddleware, updateUser);
router.put('/save-address', authMiddleware, saveAddress);
router.put('/block-user/:id', authMiddleware, isAdmin , blockUser);
router.put('/unblock-user/:id', authMiddleware, isAdmin , unblockUser);

module.exports=router;