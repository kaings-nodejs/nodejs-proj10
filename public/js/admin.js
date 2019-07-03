const deleteProduct = (btn) => {
    console.log('deleteProduct_btn..... ', btn);

    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    console.log('deleteProduct_prodId..... ', prodId);
    console.log('deleteProduct_csrf..... ', csrf);

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        console.log('deleteProduct_result..... ', result);

    })
    .catch(err => {console.log(err)})
};

