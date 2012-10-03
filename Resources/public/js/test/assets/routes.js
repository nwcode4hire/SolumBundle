/*global solum:true*/

solum.addAjaxRoutes({
  linkshare_solum_test_jslint_files: {
    name: "linkshare_solum_test_jslint_files",
    url: "solum/test/jslint/files/",
    method: "GET",
    params: []
  },
  linkshare_solum_test_jslint_run: {
    name: "linkshare_solum_test_jslint_run",
    url: "solum/test/jslint/run/",
    method: "GET",
    params: []
  },
  linkshare_solum_test_jslint_review_file: {
    name: "linkshare_solum_test_jslint_review_file",
    url: "solum/test/jslint/review/",
    method: "GET",
    params: []
  },
  linkshare_solum_test_mocha_select_suite: {
    name: "linkshare_solum_test_mocha_select_suite",
    url: "solum/test/mocha/",
    method: "GET",
    params: []
  },
  linkshare_solum_test_mocha_get_suites: {
    name: "linkshare_solum_test_mocha_get_suites",
    url: "solum/test/mocha/suites/",
    method: "GET",
    params: []
  },
  linkshare_solum_test_mocha_run_coverage: {
    name: "linkshare_solum_test_mocha_run_coverage",
    url: "solum/test/mocha/coverage/",
    method: "GET",
    params: []
  }
});