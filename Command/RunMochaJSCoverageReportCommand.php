<?php

namespace LinkShare\Bundle\SolumBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Finder\Finder;

use Symfony\Component\Console\Input\InputArgument,
    Symfony\Component\Console\Input\InputOption,
    Symfony\Component\Console;

use Symfony\Component\Console\Formatter\OutputFormatterStyle;

use Symfony\Component\Yaml\Parser;
use Symfony\Component\Yaml\Dumper;

/* TODO:
*/

class RunMochaJSCoverageReportCommand extends ContainerAwareCommand
{
    /**
     *
     */
    protected function configure()
    {
        parent::configure();

        $this
            ->setName('solum:test:mocha:coverage')
            ->setDescription(
                'Runs unit tests and JSCoverage report and generates HTML to stdout.'
              )
            ->addArgument(
                'suite-directory',
                InputArgument::OPTIONAL,
                'The source for the javascript files to be tested.',
                false
              )
            ->addOption(
                'output-file',
                'o',
                InputOption::VALUE_REQUIRED,
                'Output HTML to a file'
              );
    }

    /**
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     * @param \Symfony\Component\Console\Output\OutputInterface $result
     */
    protected function execute(Console\Input\InputInterface $input, Console\Output\OutputInterface $output)
    {
        $usr     = `whoami`;
        $usr     = trim($usr);
        $tmpDir  = '/tmp/coverage-' . $usr . '/';

        // Create an apache temp dir
        if(is_dir($tmpDir) == false) {
            $output->writeln("\n<comment>  ></comment><info>  Creating temp directory for running coverage: </info>" . $tmpDir);
            $result   = array();
            exec("mkdir {$tmpDir} 2>&1", $result, $status);
            $this->checkError($output, $status, $result, "      <error>Could not create the temp directory {$tmpDir}, received errors:</error>");
        }
        else {
            $output->writeln("\n<comment>  ></comment><info>  Cleaning the temp directory: </info>" . $tmpDir);
            $result   = array();
            $lastLine = exec("rm -rf {$tmpDir}* 2>&1", $result, $status);
            $this->checkError($output, $status, $result, '      <error>There was a problem clearing the temp dir, received errors:</error>');
        }

        // Suite is optional, otherwise search for files with the runSuiteCoverage.js file
        $rawSuite = $input->getArgument('suite-directory');
        $outFile  = $input->getOption('output-file');
        if($rawSuite) {
            $this->runSuiteCoverage($output, $rawSuite, $outFile, $tmpDir);
        }
        else {
            $suites = $this->findSuites();
            $output->writeln("<comment>  ></comment><info>  No suite was specfied, suites to be run: </info>" . count($suites));

            foreach($suites as $suite) {
                $this->runSuiteCoverage($output, $suite, null, $tmpDir);
            }
        }

        $output->writeln("\n   <info>  Success!</info>\n");
    }

    /**
     * Find all of the files named runSuiteCoverage in the src and LinkShare
     * bundles.
     *
     * @return array Array populated with suites to run
     */
    private function findSuites()
    {
        $root = $this->getContainer()->get('kernel')->getRootDir(); // the 'app' dir
        $root = str_replace('/app', '', $root);

        $jsFileFinder = new Finder();
        $jsFileFinder
            ->files()
            ->in($root . '/src/')
            ->in($root . '/vendor/bundles/LinkShare/')
            ->name('runSuiteCoverage.js');

        $files = array();
        foreach($jsFileFinder as $file) {
            $path = $file->getRealpath();
            $files[] = str_replace('/tests/mocha/runSuiteCoverage.js', '', $path);
        }

        return $files;
    }

    /**
     * All of the steps necessary to run the coverage report for a file
     *
     * @param string $suite
     * @param string $outfile
     */
    private function runSuiteCoverage($output, $rawSuite, $outFile, $tmpDir)
    {
        $output->writeln("\n<comment>  ></comment><info>  Creating a coverage report for: </info>" . $rawSuite);

        // Copy the suite to the tmp directory
        $output->writeln('<comment>  ></comment><info>  Copying suite to the tmp directory: </info>' . $tmpDir);
        $result   = array();
        $lastLine = exec("cp -r {$rawSuite} {$tmpDir}", $result, $status);
        $this->checkError($output, $status, $result, '      <error>Could not copy test directory, received errors:</error>');

        // Get the temp suite
        $name = explode('/', $rawSuite);
        $name = $name[(count($name) - 1)];
        $suite = $tmpDir . $name;

        // If there is no output file, put in a generic place that the coverage
        // web page will know about
        if(!$outFile) {
          $root = $this->getContainer()->get('kernel')->getRootDir(); // the 'app' dir
          $root = str_replace('/app', '', $root);
          $covDir  = $root . '/web/coverage/mocha/';
          $outFile = $covDir . $name . '-coverage.html';

          if(is_dir($covDir) == false) {
              $output->writeln('<comment>  ></comment><info>  No output file was specified.</info>');
              $output->writeln('<comment>  ></comment><info>  Creating coverage dir in: </info>' . $covDir);
              $result = array();
              exec('mkdir -p ' . $covDir . ' 2>&1', $result, $status);
              $this->checkError($output, $status, $result, '      <error>Could not create the coverage directory:</error>');
          }
        }

        $output->writeln('<comment>  ></comment><info>  Running the unit tests to ensure they pass before creating a coverage report.</info>');
        $output->writeln("<comment>      $> mocha {$suite}/tests/mocha/runSuite -R min 2>&1</comment>");
        $result   = array();
        $lastLine = exec("mocha {$suite}/tests/mocha/runSuite -R min 2>&1", $result, $status);
        $this->checkError($output, $status, $result, '      <error>Unit tests are not currently passing, received errors:</error>');

        $output->writeln('<comment>  ></comment><info>  Instrumenting the JS library in the lib-cov folder.</info>');
        $output->writeln("<comment>      $> mocha /usr/bin/jscoverage {$suite}/lib {$suite}/lib-cov 2>&1</comment>");
        $result   = array();
        $lastLine = exec("/usr/bin/jscoverage {$suite}/lib {$suite}/lib-cov 2>&1", $result, $status);
        $this->checkError($output, $status, $result, '      <error>JSCoverage could not instrument the library, received errors:</error>');

        $output->writeln('<comment>  ></comment><info>  Generating the coverage report.</info>');
        $output->writeln("<comment>      $> mocha {$suite}/tests/mocha/runSuiteCoverage -R html-cov-mem-fix 2>&1 > {$outFile}</comment>");
        $result   = array();
        $lastLine = exec("mocha {$suite}/tests/mocha/runSuiteCoverage -R html-cov-mem-fix 2>&1 > {$outFile}", $result, $status);
        $this->checkError($output, $status, $result, '      <error>There was a problem running the coverage report, received errors:</error>');

        $output->writeln('<comment>  ></comment><info>  Removing the copy in the temp directory</info>');
        $result   = array();
        $lastLine = exec("rm -rf {$suite} 2>&1", $result, $status);
        $this->checkError($output, $status, $result, '      <error>There was a problem running deleting the temp directory, received errors:</error>');
    }

    private function checkError($output, $status, $result, $msg) {
        if($status !== 0) {
            $output->writeln($msg);
            foreach($result as $line) {
                $output->writeln('    <error>   - ' . $line . '</error>');
            }

            exit(1);
        }
    }
}

