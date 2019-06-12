const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');
const MONGODB_URI = 'mongodb+srv://actfun07_user1:actfun07_pwuser1@cluster0-j3s72.mongodb.net/shop_mongoose_uploadDownload';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const options = {
    setHeaders: function(res, path, stat) {

        console.log('res..... ', res);
        console.log('path..... ', path);
        console.log('stat..... ', stat);

        res.set('Cache-Control', 'max-age=1000');

    }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({dest: 'images'}).single('image'));  // since we upload single file therefore 'single'. 'image' is because the 'name' of input file is 'image'
app.use(express.static(path.join(__dirname, 'public'), options));
app.use(
    session({ 
        secret: 'my_secret', 
        resave: false, 
        saveUninitialized: false, 
        store: store })     // more details: https://github.com/expressjs/session
);
app.use(csrf());    // csrf is always after the session is initiated because it needs to use the session to implement
app.use(flash());   // connect-flash will pass temporary variable into rendered page, the variable will be flushed once the page is changed

app.use((req, res, next) => {   // this will be run when there is any incoming request. it is put on top of all routes. All incoming request will trigger this middleware
    if(!req.session.user) {    // proceed without setting user in the request if there is no user found
        return next();
    };
    
    User.findById(req.session.user._id)
    .then(user => {
        console.log('user..... ', user);
        req.user = user;   // store mongoose object "user" into "req.user" so that it can be called/used globally
        next();     // move to the next middleware
    })
    .catch(err => {console.log(err)});
});

app.use((req, res, next) => {
    // with the following code, 'isAuthenticated' & 'csrfToken' will be passed during pages rendering (can do like this globally at once rather than do it one by one per render)
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
.then(result => {
    console.log(result);
    app.listen(3000);
})
.catch(err => {console.log(err)});