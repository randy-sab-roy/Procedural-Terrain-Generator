let gl = null;
let objects = [];


function draw() {
    GlUtils.resetView(gl);
    objects.forEach(o => o.draw())
    requestAnimationFrame(draw);
}

async function init() {
    canvas = document.getElementById("c");
    
    /** @type {WebGLRenderingContext} */
    gl = GlUtils.createContext(canvas)
    GlUtils.resetView(gl);

    objects = [new Cube(), new Quad()];

    for (const obj of objects) {
        await obj.init(gl);
    }

    draw();
}
