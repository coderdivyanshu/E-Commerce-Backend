const express = require('express');
const { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, liketheBlog, disliketheBlog } = require('../controller/blogCtrl');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const { uploadPhoto, productImgResize } = require('../middlewares/uploadImages');
const { uploadImages } = require('../controller/productCtrl');
const router = express.Router();


router.post('/', authMiddleware , isAdmin , createBlog);
router.put('/likes', authMiddleware , liketheBlog);
router.put('/dislikes', authMiddleware , disliketheBlog);
router.put('/upload/:id', authMiddleware , isAdmin , uploadPhoto.array('images' , 10) , productImgResize , uploadImages);
router.put('/:id', authMiddleware , isAdmin , updateBlog);
router.get('/:id',getBlog);
router.get('/',getAllBlogs);
router.delete('/:id', authMiddleware , isAdmin , deleteBlog);

module.exports = router;