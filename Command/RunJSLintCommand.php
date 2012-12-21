<?php

namespace Beum\Bundle\SolumBundle\Command;

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

class RunJSLintCommand extends ContainerAwareCommand
{
    /**
     *
     */
    protected function configure()
    {
        parent::configure();

        $this
            ->setName('solum:test:jslint')
            ->setDescription('Runs the JSLint code sniffer on js files.')
            ->addArgument('bundle', InputArgument::REQUIRED, 'The source bundle for the translations')
            ->addOption('json', null, InputOption::VALUE_NONE, 'Should the ouput be json?')
            ->addOption('terse', null, InputOption::VALUE_NONE, 'Should the files being run be displayed in the output?')
            ->addOption(
                  'excludedDirs',
                  'x',
                  InputOption::VALUE_REQUIRED|InputOption::VALUE_IS_ARRAY,
                  'Which directories in the bundle should be excluded (accepts multiple)?',
                  array('vendor')
              );
    }

    /**
     *
     * @param \Symfony\Component\Console\Input\InputInterface $input
     * @param \Symfony\Component\Console\Output\OutputInterface $output
     */
    protected function execute(Console\Input\InputInterface $input, Console\Output\OutputInterface $output)
    {
        // Add a custom style for coloring output
        $style = new OutputFormatterStyle('cyan');
        $output->getFormatter()->setStyle('file', $style);

        $style = new OutputFormatterStyle('white', 'green');
        $output->getFormatter()->setStyle('success', $style);

        $target_bundle = $input->getArgument('bundle');
        $isJson        = $input->getOption('json');
        $terse         = $input->getOption('terse');
        $excludeDirs   = $input->getOption('excludedDirs');
        $appDir        = $this->getContainer()->get('kernel')->getRootDir();

        if(!$isJson) $output->writeln("\n\n<comment>></comment> <info>Running JSLint for: </info><comment>{$target_bundle}</comment>");

        $path = $appDir . '/../src/LS/' . $target_bundle . "/";
        if (!is_dir($path)) {
            throw new \Exception("Bundle: {$path} does not exist");
        }

        if(!$isJson) $output->writeln("<comment>></comment> <info>Will run the command: </info><comment>jslint --terse --json --passfail [file]</comment>");

        $finder = new Finder();
        $finder->files()->in($path)->name('*.js');

        // Exclude the directories specified in the option
        foreach($excludeDirs as $dir) {
            if(!$isJson && !$terse) $output->writeln("<comment>></comment> <info>Excluding directory: </info><file>{$dir}</file>");
            $finder->exclude($dir);
        }

        $failed = array();
        $totalFiles = 0;
        foreach($finder as $file) {
            $path = $file->getRealPath();
            if(!$isJson && !$terse) $output->writeln("<comment>></comment> <info>Linting: </info><file>{$path}</file>");

            $jslintResult = `jslint --indent=2 --forin --terse --json --passfail $path`;
            $jsObj = json_decode($jslintResult);

            if(count($jsObj[1]) > 0) {
                $failed[] = $path;
                if(!$isJson && !$terse) $output->writeln("  <error>Failed</error>");
            }
            else {
                if(!$isJson && !$terse) $output->writeln("  <success>Passed</success>");
            }

            $totalFiles++;
         }

         $cnt = count($failed);

         if($cnt && !$isJson) {
             $output->writeln("\n  <error>Number of failed files: {$cnt} out of {$totalFiles}</error>\n");
         }
         else if(!$isJson) {
             $output->writeln("\n  <success>All {$totalFiles} files passed!</success>\n");
         }
         else {
             $outputJson = json_encode($failed);
             $output->writeln($outputJson);
         }
    }
}

