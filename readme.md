#SolumBundle
-------------------
The SolumBundle is a Symfony2 bundle that makes creating highly interactive and reusable
views within Syfmony2 easy and fun!

In addition to packaging the solum.js library, the SolumBundle provides the following:
* JS Lint javascript code quality viewer
* Mocha.js unit test coverage report command and viewer
* Examples of pages using services and reusable models.

##Installation
Add the following to your `[project]/deps` file:

    [SolumBundle]
        git=ssh://github.com/beum/SolumBundle.git
        target=/bundles/Beum/Bundle/SolumBundle

Add the following to your `[project]/app/AppKernel.php`

    new Beum\Bundle\SolumBundle\BeumSolumBundle()

Add the following to your `[project]/app/autoload.php`

    'Beum' => __DIR__.'/../vendor/bundles',

##Usage
###Demo Pages
A route to view an example paginated table:

    /solum/demo/paginated-table/

###Code Quality Pages
A route to view your javascript's compliance with JS Lint:

    /solum/test/jslint/

A route to view your javascript code coverage. First run the command:

    > php app/console solum:test:mocha:coverage

Then view the page:

    /solum/test/mocha/

Select a coverage report on the page and watch the magic happen!