const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: { type: Schema.Types.ObjectId , ref: 'Product', required: true },
            quantity: { type: Number, required: true }
        }]
    },
    resetToken: String,     // not really required, it is optional (only for those who wants to reset password)
    resetTokenExpiration: String    // not really required, it is optional (only for those who wants to reset password)
});

userSchema.methods.addToCart = function(product) {
    if (!this.cart) {
        this.cart = {items: []};
    }
    
    const productIndex = this.cart.items.findIndex(prod => prod.productId.toString() === product._id.toString());
    const updatedCartContent = this.cart.items.slice(0);
    
    if (productIndex < 0) {
        updatedCartContent.push({ productId: product._id, quantity: 1 }); 
    } else {
        updatedCartContent[productIndex].quantity = this.cart.items[productIndex].quantity + 1;
    }
    
    this.cart.items = updatedCartContent;

    return this.save();
}

userSchema.methods.deleteItemFromCart = function(productId) {
    const updatedCartContent = this.cart.items.filter(item => item._id.toString() !== productId);
    
    console.log('deleteItemFromCart_updatedCartContent..... ', updatedCartContent);

    this.cart.items = updatedCartContent;

    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []};
    
    return this.save();
};


module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getDB = require('../util/database').getDB;

// class User {
//     constructor(username, email, id, cart) {
//         this.username = username;
//         this.email = email;
//         this._id = id;
//         this.cart = cart;   // {items: []}
//     }

//     save() {
//         const db = getDB();
//         return db.collection('user').insertOne(this);
//     }

//     addToCart(product) {
//         if (!this.cart) {
//             this.cart = {items: []};
//         }

//         const db = getDB();
//         const productIndex = this.cart.items.findIndex(prod => prod.productId.toString() === product._id.toString());
//         const updatedCartContent = this.cart.items.slice(0);

//         if (productIndex < 0) {
//             updatedCartContent.push({ productId: new mongodb.ObjectId(product._id), quantity: 1 }); 
//         } else {
//             updatedCartContent[productIndex].quantity = this.cart.items[productIndex].quantity + 1;
//         }

//         return db.collection('users').updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: {items: updatedCartContent}}});
//     }

//     getCart() {
//         const db = getDB();
//         const productIds = this.cart.items.map(product => product.productId);

//         console.log('getCart..... ', productIds);

//         return db.collection('products')
//         .find({_id: {$in: productIds}})     // $in is used when you wanna find multiple (array) of products
//         .toArray()
//         .then(products => {
//             console.log('getCart_foundProducts..... ', products);
//             return products.map(product => {
//                 return {
//                     ...product,
//                     quantity: this.cart.items.find(item => item.productId.toString() === product._id.toString()).quantity
//                 }
//             });
//         })
//         .catch(err => console.log(err));
//     }

//     deleteItemFromCart(productId) {
//         const db = getDB();
//         const updatedCartContent = this.cart.items.filter(item => item.productId.toString() !== productId);

//         console.log('deleteItemFromCart_updatedCartContent..... ', updatedCartContent);

//         return db.collection('users')
//         .updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: {items: updatedCartContent}}});
//     }

//     addOrder() {
//         const db = getDB();
//         const userData = {
//             _id: new mongodb.ObjectId(this._id),
//             username: this.username
//         };

//         return this.getCart()
//         .then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new mongodb.ObjectId(this._id),
//                     username: this.username
//                 }
//             };

//             return db.collection('orders').insertOne(order)
//         })
//         .then(result => {
//             console.log('addOrder_result..... ', result);
//             const clearCart = {items: []};
//             return db.collection('users')
//             .updateOne({_id: new mongodb.ObjectId(this._id)}, {$set: {cart: clearCart}})
//         });

//         /* note */
//         // return db.collection('orders')
//         // .insertOne({ ...this.cart, ...{userId: new mongodb.ObjectId(this._id)} });   // we can also do this
//     }

//     getOrders() {
//          const db = getDB();
//          return db.collection('orders')
//          .find({'user._id': new mongodb.ObjectId(this._id)})
//          .toArray();
//     }

//     static findById(userId) {
//         const db = getDB();
//         return db.collection('users').findOne({ _id: new mongodb.ObjectId(userId) });   // this will return the object instead. "find()" will return cursor. Therefore, need "next()" or "toArray()"
//     }
// }

// module.exports = User;