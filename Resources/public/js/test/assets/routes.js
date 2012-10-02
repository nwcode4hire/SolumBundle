/*global solum:true*/

solum.addAjaxRoutes({
  solum_test_jslint_files: {
    name: "solum_test_jslint_files",
    url: "solum/test/jslint/files/",
    method: "GET",
    params: []
  },
  solum_test_jslint_run: {
    name: "solum_test_jslint_run",
    url: "solum/test/jslint/run/",
    method: "GET",
    params: []
  },
  solum_test_jslint_review_file: {
    name: "solum_test_jslint_review_file",
    url: "solum/test/jslint/review/",
    method: "GET",
    params: []
  }
});