# INF8702 - Project

## Exécution
Ce projet consiste en une application web statique. Il peut être exécuté à l'aide de n'importe quel serveur web. On ne peut pas simplement ouvrir le fichier `index.html` puisque nous utilisons un appel AJAX pour charger le code source des nuanceurs. Exemple d'exécution avec `nodejs` comme serveur web:
```
npx http-server
```


Une version fonctionnelle est également disponible sur la [page gitlab du projet](https://randy-sab-roy.gitlab.io/inf8702-project/).

## Hiérarchie de fichier
|                |                                                           |
|----------------|-----------------------------------------------------------|
| `index.html`     | Contient l'interface d'utilisateur                        |
| `index.css`      | Défini l'aspect visuel de l'interface                     |
| `index.js`       | Point d'entré de l'application. Charge le contexte WebGL  |
| `generator/`     | Générateur de terrain procédural                          |
| `quad/`          | Grille qui affiche le terrain à l'écran                   |
| `generatorView/` | Permet de visualiser la carte des hauteurs généré         |
| `utils/`         | Contient la librairie `glMatrix` et fonctions utilitaires |


## Pipeline graphique
Le générateur de terrain fonctionne sous le principe d'une carte de hauteur. Afin de réaliser ce projet, nous avons créé un pipeline graphique qui fonctionne en deux étapes. En premier lieu, on demande à WebGL de dessiner un quad dans un framebuffer lié à une texture (`generator/generator.js`). On configure préallablement le viewport du tampon à la résolution de terrain désiré. Cela nous permet d'utiliser le nuanceur de fragment (`generator/generator_fragment.glsl`) pour calculer la hauteur du terrain pour chacun des fragments du quad. En deuxième lieu, la texture de hauteur généré dans le framebuffer peut être utilisé par la grille (`quad/quad.js`) dans le nuanceur de sommet (`quad/quad_vertex.glsl`) afin de remodeler le grille. Le nuanceur de fragment de la grille (`quad_fragment.glsl`) est finalement utilisé pour changer l'aspect visuel du terrain.