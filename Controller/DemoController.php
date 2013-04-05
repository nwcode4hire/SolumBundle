<?php

namespace Beum\SolumBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;


class DemoController extends Controller
{

    public function indexAction()
    {
        return $this->render('BeumSolumBundle:demo:index.html.twig', array(
            'examples' => array(
                array(
                    'name'        => 'Paginated Table',
                    'type'        => 'Model',
                    'description' => 'An example paginated table using the AJAX service.',
                    'path'        => $this->generateURL()
                ),
            )
        ));
    }

    /**
     * Demonstrate how to build a paginated table using either a 2D array or an
     * array of associative arrays with named properties.
     *
     * @param string $type
     * @return Response
     */
    public function paginatedTableAction($type)
    {
        return $this->render('BeumSolumBundle:demo:paginatedTable.html.twig', array(
            'type' => $type
        ));
    }

    /**
     * Generate fake data for the example page
     * @param Request $request
     */
    public function ajaxDataAction(Request $request)
    {
        $type     = $request->get('type', 'named'); // Use named properties or an indexed array

        // Get pagination parameters
        $sr = $request->get('start_row', 1);
        $er = $request->get('end_row', 25);
        $sc = $request->get('sort_col', 0);
        $sd = $request->get('sort_direction', 'A');

        // Hard code the total row count to 101 for example purposes
        $totalCount = 101;

        $data = array();
        $alphabet = array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z');

        for($i = 0; $i <= $totalCount; $i++) {
            if($type == 'named') {
                $t = array(
                    'col0' => $i,
                    'col1' => $alphabet[$i % 26],
                    'col2' => $i + 57,
                    'col3' => 'hello'.$alphabet[$i % 26],
                    'col4' => $i % 7
                );
            }
            else {
                $t = array(
                    $i,
                    $alphabet[$i % 26],
                    $i + 57,
                    'hello'.$alphabet[$i % 26],
                    $i % 7
                );
            }

            $data[] = $t;
        }

        // Convert the sort index if the array indices are named
        if($type == 'named') {
            $sc = 'col'.$sc;
        }

        $sorted = $this->sort_multi_array($data, $sc, $sd);

        $data = array();
        $i = 0;
        foreach($sorted as $record) {
            if($i >= $sr && $i <= $er) {
                $data[] = $record;
            }
            else if($i > $er) {
                break;
            }

            $i++;
        }

        $r = array(
            'Response' => $data,
            'Page'     => array(
                'StartRow'  => $sr,
                'EndRow'    => $er,
                'TotalRows' => $totalCount
            )
        );

        $response = new Response(json_encode($r));
        $response->headers->set('Content-Type', 'application/json');
        return $response;
    }

    private function sort_multi_array($array, $key, $sort_direction)
    {
        // create a custom search function to pass to usort
        $asc = function ($a, $b) use ($key) {
            if ($a[$key] != $b[$key]) {
                return ($a[$key] < $b[$key]) ? -1 : 1;
            }
            return 0;
        };

        $desc = function ($a, $b) use ($key) {
            if ($a[$key] != $b[$key]) {
                return ($a[$key] < $b[$key]) ? 1 : -1;
            }
            return 0;
        };

        if ($sort_direction == 'D') {
            usort($array, $desc);
        }
        else {
            usort($array, $asc);
        }


        return $array;
    }
}
