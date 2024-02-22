function cleanColumnOutput(data, type, row) {
  const unsafeOutputPattern = />|<|&|"|\/|'/g
  return data.replace(unsafeOutputPattern, '')
}

jQuery(function () {
  $('#productsTable').DataTable({
    lengthMenu: [
      [10, 25, 50, 75, 100, -1],
      [10, 25, 50, 75, 100, 'All'],
    ],
    paging: true,
    pagingType: 'simple_numbers',
    order: [[1, 'asc']],
    sortable: true,
    ajax: {
      url: '/products/data',
      dataSrc: '',
      error: function (response) {
        alert('An error occurred when loading products.') // eslint-disable-line no-undef
      },
    },

    columns: [
      {
        data: 'attributes.p_id',
        createdCell: function (td, cellData, rowData) {
          $(td).html(`<a href="/products/${rowData.id}">${rowData.attributes.p_id}</a>`)
        },
      },
      { data: 'attributes.name', render: cleanColumnOutput },
      {
        data: 'attributes.product_set.data.attributes.ps_id',
        createdCell: function (td, cellData, rowData) {
          const link = rowData.attributes.product_set.data
            ? `<a href="/product-sets/${rowData.attributes.product_set.data.id}">${cleanColumnOutput(
                rowData.attributes.product_set.data.attributes.ps_id,
              )}</a>`
            : 'N/A'
          $(td).html(link)
        },
      },
      {
        data: 'attributes.product_set.data.attributes.name',
        createdCell: function (td, cellData, rowData) {
          const link = rowData.attributes.product_set.data
            ? cleanColumnOutput(rowData.attributes.product_set.data.attributes.name)
            : 'N/A'
          $(td).html(link)
        },
      },
    ],
  })
})
