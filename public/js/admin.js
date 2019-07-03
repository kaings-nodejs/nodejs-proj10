const deleteProduct = (btn) => {
    console.log('deleteProduct_btn..... ', btn);

    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const targetElement = btn.closest('article');

    console.log('deleteProduct_prodId..... ', prodId);
    console.log('deleteProduct_csrf..... ', csrf);
    console.log('deleteProduct_targetElement..... ', targetElement);

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        console.log('deleteProduct_result..... ', result);
        targetElement.parentNode.removeChild(targetElement);
    })
    .catch(err => {console.log(err)})
};

