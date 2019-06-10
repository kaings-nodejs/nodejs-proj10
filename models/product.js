const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',    // the reference to other collection model. The name 'User' follows the model name we created
    required: true
  }
});

module.exports = mongoose.model('Product', productSchema);

// const mongodb = require('mongodb');
// const getDB = require('../util/database').getDB;

// class Product {
//   constructor(title, price, description, imageUrl, id) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imageUrl = imageUrl;
//     this._id = (id)? new mongodb.ObjectId(id) : null;
//   }

//   save() {
//     const db = getDB();
//     let dbOp;

//     if (this._id) {
//       dbOp = db.collection('products').updateOne( {_id: this._id}, {$set: this} );
//     } else {
//       dbOp = db.collection('products').insertOne(this);
//     }

//     return dbOp;
//   }

//   static fetchAll() {
//     const db = getDB();
//     return db.collection('products')
//     .find()
//     .toArray(); // find() return cursor that points to documents. Therefore, toArray() is needed to return Promise. ref: https://docs.mongodb.com/manual/reference/method/cursor.toArray/index.html
//   }

//   static findById(prodId) {
//     const db = getDB();
//     return db.collection('products')
//     .find( {_id: new mongodb.ObjectId(prodId)} )
//     .next();
//   }

//   static deleteById(prodId) {
//     const db = getDB();
//     return db.collection('products')
//     .deleteOne({_id: new mongodb.ObjectId(prodId)});
//   }
// }


// module.exports = Product;