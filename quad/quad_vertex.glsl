attribute vec3 position;
attribute vec4 color;

uniform mat4 model;
uniform mat4 projection;

varying vec4 fcolor;

void main() {
    vec3 pos = position;
    pos.z = pos.x * pos.y;
    gl_Position = projection * model * vec4( pos, 1.0 );
    fcolor = color;
}