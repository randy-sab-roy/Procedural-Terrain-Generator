let gl = null;
let objects = [];


function draw() {
    objects.forEach(o => o.draw())
    requestAnimationFrame(draw);
}

async function init() {
    canvas = document.getElementById("drawCanvas");

    /** @type {WebGLRenderingContext} */
    gl = GlUtils.createContext(canvas)
    objects = [new Generator(), new Quad()];

    for (const obj of objects) {
        await obj.init(gl);
    }

    draw();
}