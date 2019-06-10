const express = require('express');
const { check, body } = require('express-validator/check');
const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getAuth);

router.post('/login', authController.postAuth);

router.get('/signup', authController.getSignup);

router.post(
    '/signup', 
    [
        check('email')  // check & validate 'email' (location could be body, header, etc. not specified)
        .isEmail()
        .withMessage('Please Enter a Valid Email!').custom((value, { req }) => {    // the options contains req, location, path. But, we only interested in req.
            console.log('router_postSignup_value..... ', value, '\noption..... ', req);
            // if (value === 'test@test.com') {
            //     throw new Error('This Email is Forbidden!');
            // }

            // return true;

            return User.findOne({email: value})
            .then(userDoc => {
                console.log('postSignup_userDoc..... ', userDoc);
        
                if (userDoc) {
                    /* validator will check get error 1) if there is error thrown, 2) return Promise is rejected */
                    return Promise.reject('Email Already Exist!!');
                }
            })
        })
        .normalizeEmail(),  // normalize email input https://github.com/chriso/validator.js#sanitizers

        body('password', 'Please Enter Password with Only Numbers & Min. 5 Characters!')    // check & validate 'password' (specified location on the body)
        .isLength({ min: 5 })
        //.withMessage('Please Enter Password with at Least 5 Characters!')   // you can also specify each message for each validations like this
        .isNumeric()
        //.withMessage('Please Enter Password with Only Numbers')     // you can also specify each message for each validations like this
        .trim(),    // trim any whitespace https://github.com/chriso/validator.js#sanitizers

        body('confirmPassword').custom((value, { req }) => {
            if(value !== req.body.password) {
                throw new Error('Password MUST Match!');
            }
            return true;
        })
    ],
    authController.postSignup
    );

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:resetToken', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;