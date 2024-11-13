jQuery(function () {
  $('#submitdata').on('click', async e => {
    e.preventDefault(e)
    console.log(`submit clicked`)

    $.ajax({
      url: 'https://test.co.uk/v1/sss',
      crossDomain: true,
      method: 'post',
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer 25ccee26685f02dd6da43f63',
      },
      contentType: 'application/json',
    }).done(function (response) {
      console.log(response)
    })
  })
})
