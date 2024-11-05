const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer= require('multer');
const fs = require('fs');
const { type } = require('os');
//image upload
var storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null,'./uploads');
    },
    filename: function(req, file,cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);

    },
});

var upload= multer({
    storage:storage,

}).single('image');
   
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image:req.file.filename,
        });

        await user.save();
        
        req.session.message = {
            type: 'success',
            message: 'User added successfully!'
        };
        
        res.redirect('/');
        console.log(user);
    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});
//Get all users route

router.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: "Home Page",
            users: users,
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});
router.get('/add',(req,res)=>{
    res.render("add_users",{title:"Add Users"});
});

//Edit an user route
router.get('/edit/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.redirect('/');
        }

        res.render('edit_users', {
            title: 'Edit User',
            user: user,
        });
    } catch (err) {
        console.log('Error finding user:', err);
        res.redirect('/');
    }
});

//Update user route
router.post('/update/:id',upload, async (req, res) => {
    const id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            if (req.body.old_image) {
                fs.unlinkSync(`./uploads/${req.body.old_image}`);
            }
        } catch (err) {
            console.log('Error deleting old image:', err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        }, { new: true });

        if (!updatedUser) {
            return res.json({ message: "User not found", type: "danger" });
        }

        req.session.message = {
            type: 'success',
            message: "User updated successfully!",
        };
        res.redirect('/');
    } catch (err) {
        console.log('Error updating user:', err);
        res.json({ message: err.message, type: "danger" });
    }
});
//Delete user route
router.get('/delete/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const user = await User.findByIdAndDelete(id); // This will delete the user

        if (user && user.image) {
            try {
                fs.unlinkSync(`./uploads/${user.image}`);
            } catch (err) {
                console.log('Error deleting file:', err);
            }
        }

        req.session.message = {
            type: 'info',
            message: "User deleted successfully!",
        };
        res.redirect('/');
    } catch (err) {
        console.log('Error deleting user:', err);
        res.json({ message: err.message });
    }
});

module.exports=router;