// Add the ajax routes by configuring the service appropriately
solum.addAjaxRoutes({
  linkshare_solum_demo_ajax_data: {
    name: "linkshare_solum_demo_ajax_data",
    url: "solum/demo/ajax-data/{type}",
    method: "GET",
    params: [
      { name: "type", defaultValue: "flat" }
    ]
  }
});


