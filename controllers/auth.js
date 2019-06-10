const User = require('../models/user');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const mailer = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: '' // fill in SendGrid API_KEY
    }
}));

const crypto = require('crypto');

exports.getAuth = (req, res, next) => {
    console.log('getAuth_session..... ', req.session); // get session

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errMessage: req.flash('error')
    });
};

exports.postAuth = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let currentUser;

    User.findOne({email: email})
    .then(user => {
        console.log('postAuth_user..... ', user);
        currentUser = user;

        if(!user) {
            req.flash('error', 'Invalid Email or Password!');
            return res.redirect('/login');
        }

        return bcrypt.compare(password, user.password); // compare the input password & hashed password in DB (one way encryption)
    })
    .then(passwordMatch => {
        console.log('postAuth_passwordMatch..... ', passwordMatch);

        if(passwordMatch) {    // bcrypt.compare will return Promise of true or false. True if password match and False if not match
            req.session.isLoggedIn = true;     // set a property in session
            req.session.user = currentUser;
            req.session.save(err => {   // save the above set session before redirect just as guarantee the session is set before redirecting
                console.log(err);
                res.redirect('/');
            });
        } else {
            res.redirect('/login');
        }
    })
    .catch(err => {console.log(err)});
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errMessage: req.flash('error'),
      prevInput: {
          email: '',
          password: '',
          confirmPassword: ''
      },
      validatorParams: validationErr.array()
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const validationErr = validationResult(req);

    if (!validationErr.isEmpty()) {
        console.log('postSignup_validationErr..... ', validationErr);
        console.log('postSignup_validationErr.array()..... ', validationErr.array());

        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errMessage: validationErr.array()[0].msg,
            prevInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validatorParams: validationErr.array()
        });
    }


    bcrypt
    .hash(password, 12)   // the higher the salt, the more secure https://github.com/dcodeIO/bcrypt.js
    .then(hashedPassword => {
        console.log('postSignup_hashedPassword..... ', hashedPassword);

        if(hashedPassword) {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
    
            return user.save();
        }
        return null;
    })
    .then(result => {
        console.log('postSignup_result..... ', result);

        if(result) {
            res.redirect('/login');

            const mailDetails = {
                to: email,
                from: 'dummy@test.com',
                subject: 'Hi there',
                text: 'Awesome sauce',
                html: '<b>Awesome sauce</b>'
            };

            /* Note:
            It is better NOT to wait sending email process to finish before redirecting (make the 2 process asynchronous as this one is better)
            the reason is if emails to be sent is alot, it will be long waiting before redirecting
             */

            //this code works as well but without returning promise
            // mailer.sendMail(mailDetails, (err, res) => {
            //     console.log('mailer.sendMail..... ', res, '\n', err);
            // });

            return mailer.sendMail(mailDetails);    // the one with returning promise
        }
    })
    .then(sendMail_result => {
        console.log('postSignup_sendMail_result..... ', sendMail_result);
    })
    .catch(err => {console.log(err)});
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errMessage: req.flash('error')
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log('postReset_err..... ', err);
            return res.redirect('/reset');
        }

        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user) {
                req.flash('error', 'No Account with that Email Found!');
                return res.redirect('/reset');
            }

            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            console.log('postReset_result..... ', result);

            res.redirect('/login');
            
            mailer.sendMail(
                {
                    to: req.body.email,
                    from: 'dummy@test.com',
                    subject: 'Password Reset',
                    html: `
                        <p>You Requested a Password Reset</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set new password.</p>
                    `
                },
                (err, res) => {
                    console.log('postReset_sendMail..... err: ', err, '\nres: ', res);
                }
            );
        })
        .catch(err => console.log(err));
    })
}

exports.getNewPassword = (req, res, next) => {
    console.log('getNewPassword_resetToken..... ', req.params.resetToken);

    const token = req.params.resetToken;

    User.findOne({ 
        resetToken: token, 
        resetTokenExpiration: {$gt: Date.now()}     // to filter out resetTokenExpiration is greater than ($gt) Date.now() (this is in milisecond) to check the expiration of the token
    })
    .then(user => {
        console.log('getNewPassword_user..... ', user);

        if(!user) {
            req.flash('error', 'Reset Token is Invalid or Expired!');
            return res.redirect('/reset');
        }

        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errMessage: req.flash('error'),
            userId: user._id.toString(),
            passwordResetToken: token
        });
    })
    .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.password;
    const passwordResetToken = req.body.passwordResetToken;
    let resetUser;

    User.findOne({
        _id: userId,
        resetToken: passwordResetToken,
        resetTokenExpiration: {$gt: Date.now()}
    })
    .then(user => {
        console.log('postNewPassword_user..... ', user);

        if(!user) {
            req.flash('error', 'User Not Found!');
            req.redirect('/reset')
        }

        resetUser = user;

        return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
        console.log('postNewPassword_hashedPassword..... ', hashedPassword);

        if(hashedPassword) {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;

            return resetUser.save();
        }
        return null;
    })
    .then(result => {
        console.log('postNewPassword_result..... ', result);

        res.redirect('/login');
    })
    .catch(err => {console.log(err)});
};