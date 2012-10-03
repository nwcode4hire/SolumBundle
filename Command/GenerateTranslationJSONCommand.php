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

class GenerateTranslationJSONCommand extends ContainerAwareCommand
{
    /**
     *
     */
    protected function configure()
    {
        parent::configure();

        $this
            ->setName('solum:generate:js:translations')
            ->setDescription('Symfony Task for Generating Translation JSON Objects.')
            ->addArgument('path', InputArgument::REQUIRED, 'Path to the file where you want to write the translation JSON.')
            ->addArgument('bundle', InputArgument::REQUIRED, 'The source bundle for the translations');
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

        $content = "";
        $JSONfilePath  = $input->getArgument('path');
        $target_bundle = $input->getArgument('bundle');
        $appDir        = $this->getContainer()->get('kernel')->getRootDir();

        $output->writeln("\n\n<comment>></comment> <info>Generating JSON file of translations for: </info><comment>{$target_bundle}</comment><info> and placing them in </info><comment>{$JSONfilePath}</comment>");

        $path_to_translations = $appDir . '/../src/LS/' . $target_bundle . "/Resources/translations/";
        if (!is_dir($path_to_translations)) {
            throw new \Exception("Bundle path: {$path_to_translations} does not exist");
        }

        $finder = new Finder();
        $finder->files()->in($path_to_translations)->name('*.yml');
        foreach($finder as $file) {
            $path = $file->getRealPath();

            $output->writeln("<comment>></comment> <info>Parsing: </info><file>{$path}</file>");

            $content = file_get_contents($path);
            $fileName = explode(".", $file->getRelativePathname());

            $yaml = new Parser();
            $params = $yaml->parse($content);
            $params_keys = array_keys($params);
            if(count($params_keys) > 0) {
                $param_by_lang[$fileName[1]][$params_keys['0']]= $params[$params_keys['0']];
            }
         }

          $json = json_encode($param_by_lang);

          // Add some of the necessary solum pieces
          $json = "solum.addDictionary(\n  JSON.parse('" . $json . "')\n);";

          if(file_put_contents($JSONfilePath, $json)) {
              $output->writeln("<comment>></comment> <info>The file was written successfully!</info>\n");
          }
          else {
              throw new \Exception("Failed to write the file to: {$JSONfilePath}");
          }
    }
}

