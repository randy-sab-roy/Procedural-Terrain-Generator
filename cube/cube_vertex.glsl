attribute vec3 position;
attribute vec4 color;

uniform mat4 model;
uniform mat4 projection;

varying vec4 vColor;

void main() {
    vColor = color;

    gl_Position = projection * model * vec4( position, 1.0 );
}