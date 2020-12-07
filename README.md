# INF8702 - Project
This project uses fractals to procedurally generate and display a terrain.

## Execution
The project consist in a static website. It can be executed with any web server, but can't be directly opened locally because the shaders are loaded at runtime with AJAX calls. Example with `nodejs` as a web server:
```
npx http-server
```

## Contents
| Files / Folders  | Description                                          |
|------------------|------------------------------------------------------|
| `index.html`     | Contains the user interface                          |
| `index.js`       | Entry point of the WebGL app                         |
| `generator/`     | Terrain generator                                    |
| `quad/`          | Displacement grid used to visualize the terrain      |
| `generatorView/` | Allows to view the generated height map in real time |
| `utils/`         | Contains the `glMatrix` library and utils functions  |