let gl = null;

let generator = null;
let quad = null;


function draw() {
    GlUtils.resizeCanvas(gl);
    
    generator.draw();
    quad.draw();

    requestAnimationFrame(draw);
}

async function init() {
    const mainCanvas = document.getElementById("drawCanvas");
    gl = GlUtils.createContext(mainCanvas);

    generator = new Generator();
    quad = new Quad();

    await generator.init(gl);
    await quad.init(gl);

    draw();
}