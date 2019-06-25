const Product = require('../models/product');
const Order = require('../models/order');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const ITEMS_PER_PAGE = 2;

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
  const page = +req.query.page || 2;  // if query 'page' not found, then set query page=2
  let totalItems;

  Product.find()
  .countDocuments()
  .then((numOfProducts) => {
    console.log('getIndex_numOfProducts..... ', numOfProducts, 'page..... ', page);
    totalItems = numOfProducts;

    return Product.find()
    .skip((2 * page) - ITEMS_PER_PAGE)                // skip the first nth item(s), if '2' meaning skip the first 2 items. So, only show 3rd item onwards up to the limit(if no limit then dispay all)
    .limit(ITEMS_PER_PAGE); // limit number of item(s), eg. ITEMS_PER_PAGE is 2, meaning only limit to MAX. 2 items is shown
  })
  .then((products) => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      numOfPages: Math.ceil(totalItems/ITEMS_PER_PAGE)
    });
  })
  .catch(err => {
    console.log(err);
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

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = 'invoice-' + orderId + '.pdf';
  const invoicePath = path.join('data', 'invoices', invoiceName);

  Order.findById(orderId)
  .then(order => {
    console.log('getInvoice_order..... ', order);
    
    if(order.user.userId.toString() !== req.session.user._id.toString()) {
      throw new Error('Invalid Order ID!');
    }

    /* 
    read file like this will read the whole file into memory 
    (maybe not enough memory for big files if we read file like this) and return it with response. 
    For big files, it is better to read file by chunks (creadReadStream is the solution) 
    */ 
    // fs.readFile(invoicePath, (err, data) => {
    //   console.log('getInvoice_data..... ', data);
  
    //   if(err) {
    //     return next(err);
    //   }
  
    //   res.setHeader('Content-Type', 'application/pdf');   // set the extension of the file 'pdf'
    //   // res.setHeader('Content-Disposition', 'inline');   // open the pdf in same tab
    //   // res.setHeader('Content-Disposition', 'attachment');   // open download dialog box or download the pdf file directly (with random hashed filename)
    //   res.setHeader('Content-Disposition', `attachment; filename="${invoiceName}"`);   // open download dialog box or download the pdf file directly (with proper defined filename)
  
    //   res.send(data);
    // });

    // const file = fs.createReadStream(invoicePath);  // read data in chunks/stream
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'inline');
    // file.pipe(res);   // pipe the readable stream output into writable stream. response is one of the writable stream object

    const pdfDocument = new PDFDocument();   // pdfDocument here is readable stream. Therefore, you can pipe it to writable stream as well
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);

    pdfDocument.pipe(fs.createWriteStream(invoicePath));  // pipe to writable stream to create PDF document of invoice (invoicePath)
    pdfDocument.pipe(res);  // and also, pipe it to writable stream of response (to display in the browser)

    pdfDocument.fontSize(20).text('DOCUMENT TITLE', {underline: true});
    pdfDocument.fontSize(16).text(`TESTING INVOICE - ${invoiceName}`);   // write on the PDF
    pdfDocument.end();  // to indicate that the writing is done. Therefore, get the blob!
  })
  .catch(err => {
    console.log(err);
    return next(new Error('catch Error: Invalid Order ID!'))
  });
  
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
