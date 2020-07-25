# Translator

## PrivateConstants.js

you need to add a `PrivateConstants.js` file with `export const TRANSLATOR_URL = 'https://x.com/api/translate'`

## Translate API

__Exemple:__  
```php
<?php
namespace App\Controller;

use Cake\Core\Configure;
use Google\Cloud\Translate\V2\TranslateClient;
use Google\Cloud\Vision\V1\EntityAnnotation;
use Google\Cloud\Vision\V1\ImageAnnotatorClient;

class TranslateController extends AppController
{
    public function img(string $lang = 'en')
    {
        $request = $this->getRequest();
        $request->allowMethod('post');
        $image64 = file_get_contents('php://input');
        $b64 = json_decode($image64, true)['img64'];
        $image = base64_decode($b64);
        $text = $this->translate(
            $this->detectText($image),
            $lang
        );
        return $this->getResponse()
            ->withType('json')
            ->withStringBody(json_encode($text));
    }

    private function translate(string $text, string $lang): string
    {
        $client = new TranslateClient(
            [
                'key' => Configure::read('Google.api.key'),
            ]
        );
        return $client->translate($text, ['target' => $lang])['text'];
    }

    private function detectText(string $binary): string
    {
        $imageAnnotator = new ImageAnnotatorClient(
            [
                'credentials' => json_decode(
                    file_get_contents(CONFIG.'keys/google.key.json'),
                    true
                )
            ]
        );
        $response = $imageAnnotator->textDetection($binary);
        $texts = $response->getTextAnnotations();
        $str = '';
        /** @var EntityAnnotation $text */
        foreach ($texts as $text) {
            $str .= $text->getDescription() . PHP_EOL;
            break;
        }
        $imageAnnotator->close();
        return $str;
    }
}
```