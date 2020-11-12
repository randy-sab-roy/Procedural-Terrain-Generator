attribute vec3 position;
attribute vec4 color;

uniform mat4 model;
uniform mat4 projection;

varying vec4 fcolor;

void main() {
    vec4 pos = projection * model * vec4( position, 1.0 );
    gl_Position = pos;
    fcolor = color;
}