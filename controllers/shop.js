const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  console.log('shopRoute_getProducts_loggedIn..... ', req.session.isLoggedIn);

  Product.find()
  .then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products'
    });
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;

  Product.findById(prodId)
  .then(product => {
    res.render('shop/product-detail', {
      product: product,
      pageTitle: product.title,
      path: '/products'
    });
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getIndex = (req, res, next) => {
  Product.find()
  .then(products => {
    //console.log(products)
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  })
  .catch(err => {
    console.log(err)
  });
};

exports.getCart = (req, res, next) => {
  req.user
  .populate('cart.items.productId')   // populate related 'Product' into path 'cart.items.productId' (as set in model as ref in the same path)
  .execPopulate()   // convert populate into Promise
  .then(userData => {
    console.log('getCart_cartItems..... ', userData.cart.items)
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products: userData.cart.items
    });
  })
  .catch(err => {console.log(err)});
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    console.log('postCart_product..... ', product);
    return req.user.addToCart(product);
  })
  .then(result => {
    console.log('postCart_result..... ', result);
    res.redirect('/cart');
  })
  .catch(err => {console.log(err)});
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  console.log('postCartDeleteProduct_prodId..... ', prodId);

  req.user.deleteItemFromCart(prodId)
  .then(result => {
    console.log('postCartDeleteProduct_result..... ', result);
    res.redirect('/cart');
  })
  .catch(err => {console.log(err)});
};

exports.postOrder = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(userData => {
    console.log('postOrder_userData.cart.items..... ', userData.cart.items);

    const products = userData.cart.items.map(productObj => {
      return { 
        // product: productObj.productId,    // (1) this won't work! Only store the ObjectId of the product
        // product: { ...productObj.productId },  // (2) this WORKS! It will populate the product property with the object metadata of Product
        product: { ...productObj.productId._doc },  //  this WORKS too as (2) _doc is to specify only the metadata of the object
        quantity: productObj.quantity 
      };
    });

    const order = new Order({
      user: {
        userId: req.session.user._id,
        email: req.session.user.email
      },
      items: products
    });

    return order.save();
  })
  .then(result => {
    console.log('postOrder_result..... ', result);
    return req.user.clearCart();
  })
  .then(() => {
    res.redirect('/orders');
  })
  .catch(err => {console.log(err)});
};

exports.getOrders = (req, res, next) => {
  Order.find({'user.userId': req.user._id})   // find order that belongs to a particular user
  .then(orders => {
    console.log('getOrders_orders..... ', orders);
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders
    });
  })
  .catch(err => {console.log(err)});

  // req.user
  // .getOrders({include: ['copy_sqlz_products']})
  // .then(orders => {
  //   console.log('getOrders_orders..... ', orders);
  //   res.render('shop/orders', {
  //     path: '/orders',
  //     pageTitle: 'Your Orders',
  //     orders: orders
  //   });
  // })

  
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
