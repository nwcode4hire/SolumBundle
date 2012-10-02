<?php

namespace LS\SolumBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Finder\Finder;

/**
 * Demonstrates that the unit tests pass, that they are fully covered, and have
 * code quality.
 *
 * @author brandon.eum
 */
class TestController extends Controller
{
    /**
     * Loads all the files necessary to run mocha in the browser
     */
    public function unitTestAction()
    {

    }

    /**
     * Runs the JSCoverage task to create the instrumented JS files and then generates
     * the HTML page in the temp directory and serves it up in the response
     */
    public function unitTestCoverageAction()
    {

    }

    /**
     * JSLint is a code-sniffer for javascript, this will run the specified files
     * in the browser and tell you about their quality.
     */
    public function jsLintSelectFileAction()
    {
        return $this->render('SolumBundle:test:jslintSelectFile.html.twig');
    }

    /**
     * After selecting a file, we get the file contents here, and run the jsLint
     * command.
     */
    public function jsLintReviewFileAction(Request $request)
    {
        $root = $this->get('kernel')->getRootDir(); // this is the 'app' directory
        $target = $request->get('target', false);

        // Return nothing if the target was not sent
        if(!$target) {
            $data = "Target not specified.";
        }
        else {
            $data = file_get_contents($root . '/../src/LS/' . $target);
        }

        return $this->render('SolumBundle:test:jslintReview.html.twig', array(
            'file_content' => $data,
            'target'       => $target
        ));
    }

    /**
     * In order to populate the menu, return a JSON string of a hierarchy of files
     *
     * @todo Return a flat array of files and do the object building on the client-side
     *       that will be much more useful than the way it is now.
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function jsLintFilesAction()
    {
        $root = $this->get('kernel')->getRootDir(); // this is the 'app' directory

        // Find all the javascript files in the LS dir
        $jsFileFinder = new Finder();
        $jsFileFinder->files()->in($root . '/../src/LS/')->name('*.js');

        $files = array();
        foreach($jsFileFinder as $file) {
            // strip out everything before /LS/
            $removePath = '/LS/';
            $pos        = strpos($file->getRealpath(), $removePath);
            $relpath    = substr($file->getRealpath(), $pos + strlen($removePath));

            $files[] = $relpath;
        }

        // Find all of the js files for this application
        $json = json_encode($files);
        $r = new Response($json);
        $r->headers->set('content-type', 'application/json');
        return $r;
    }

    /**
     * Actually runs the jslint command and gets the json output to send back to
     * the browser (after cleaning it up a little).
     */
    public function jsLintRunAction(Request $request)
    {
        $root = $this->get('kernel')->getRootDir(); // this is the 'app' directory
        $target = $request->get('target', false);

        // Return nothing if the target was not sent
        if(!$target) {
            return new Response('{}');
        }

        $target = $root . '/../src/LS/' . $target;
        $output = `jslint $target --indent=2 --terse --json --maxerr=100`;

        $r = new Response($output);
        $r->headers->set('content-type', 'application/json');
        return $r;
    }
}