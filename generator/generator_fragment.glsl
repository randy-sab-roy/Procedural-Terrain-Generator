precision mediump float;

varying vec2 fuv;

void main() {
    gl_FragColor = vec4(fuv.x,fuv.x, fuv.x, 1.0);
}